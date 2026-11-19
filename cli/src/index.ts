#!/usr/bin/env node
import { Command } from 'commander';
import { WorktreeStore, SessionStore, agentName, agentIcon, agentCliBin } from '@otp/core';
import { join, homedir } from 'node:path';
import { startAgent } from '@otp/core/agent.js';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';

const DATA_DIR = join(homedir(), '.otp', 'data');
const wts = new WorktreeStore(DATA_DIR);
const sessions = new SessionStore(DATA_DIR);

const program = new Command();

program.name('otp').description('Personal AI coding agent orchestrator').version('0.1.0');

// ── worktree ──────────────────────────────────────────────────────────────
program.command('worktree <name>').description('Create a worktree')
  .option('-r, --repo <path>', 'Git repo path', process.cwd())
  .action(async (name, opts) => {
    const wt = wts.create(name, opts.repo);
    console.log(`\n✓ Created worktree: ${wt.name}`);
    console.log(`  ID:       ${wt.id}`);
    console.log(`  Path:     ${wt.path}`);
    console.log(`  Branch:   ${wt.branch}`);
    console.log(`  Sessions: ${wt.sessionIds.length}`);
    console.log(`\n  otp session --worktree-id ${wt.id} --agent opencode\n`);
  });

program.command('worktree:ls').alias('ls').description('List worktrees')
  .action(() => {
    const list = wts.all();
    if (!list.length) { console.log('No worktrees.\n'); return; }
    console.log(`\n${'Name'.padEnd(20)} ${'ID'.slice(0,14)} ${'Branch'.padEnd(30)} Sessions`);
    console.log('─'.repeat(70));
    for (const w of list) console.log(`${w.name.padEnd(20)} ${w.id.slice(0,14)} ${w.branch.padEnd(30)} ${w.sessionIds.length}`);
    console.log('');
  });

program.command('worktree:rm <id>').alias('delete').description('Remove worktree')
  .argument('id', 'Worktree ID').action(id => {
    if (wts.delete(id)) console.log(`✓ Removed: ${id}\n`);
    else console.error(`✗ Not found: ${id}\n`);
  });

// ── session ───────────────────────────────────────────────────────────────
program.command('session').description('Manage sessions');

program.command('session:create').description('Create a new session')
  .option('-w, --worktree-id <id>', 'Worktree ID')
  .option('-a, --agent <type>', 'Agent type', 'opencode')
  .action((opts) => {
    if (!opts.worktreeId) { console.error('Error: --worktree-id required\n'); process.exit(1); }
    const wt = wts.get(opts.worktreeId);
    if (!wt) { console.error(`✗ Worktree not found: ${opts.worktreeId}\n`); process.exit(1); }
    const s = sessions.create(wt.id, opts.agent);
    wts.addSession(wt.id, s.id);
    console.log(`\n✓ Created session: ${s.id}`);
    console.log(`  Agent:  ${opts.agent}`);
    console.log(`  Wt:     ${wt.name}`);
    console.log(`  Status: ${s.status}`);
    console.log(`  Run:    otp session:start ${s.id}\n`);
  });

program.command('session:start <id>').description('Start a session agent')
  .argument('id', 'Session ID').action(async (id) => {
    const s = sessions.get(id);
    if (!s) { console.error(`✗ Session not found: ${id}\n`); process.exit(1); }
    const wt = wts.get(s.worktreeId);
    if (!wt) { console.error(`✗ Worktree not found: ${s.worktreeId}\n`); process.exit(1); }

    const proc = startAgent(s.agentType, wt.path);

    sessions.update(id, { status: 'running', pid: proc.pid, cwd: wt.path });
    console.log(`\n✓ Started session: ${id}`);
    console.log(`  Agent: ${agentName(s.agentType)} ${agentIcon(s.agentType)}`);
    console.log(`  Bin:   ${agentCliBin(s.agentType)}`);
    console.log(`  PID:   ${proc.pid}`);
    console.log(`  CWD:   ${wt.path}\n`);

    // Stream stdout/stderr
    const logStream = (label: string, stream: NodeJS.ReadableStream) => {
      stream.on('data', (chunk) => {
        const text = chunk.toString();
        if (text.trim()) console.log(`[${label}] ${text.replace(/\n/g, '\n[' + label + '] ')}`);
      });
    };
    logStream('AGENT', proc.stdout);
    logStream('ERR', proc.stderr);

    proc.stop();
    sessions.update(id, { status: 'idle', pid: undefined });
    console.log(`\n✗ Stopped session: ${id}\n`);
  });

program.command('session:stop <id>').description('Stop a session agent')
  .argument('id', 'Session ID').action(id => {
    sessions.update(id, { status: 'idle', pid: undefined });
    console.log(`✓ Stopped: ${id}\n`);
  });

program.command('session:ls').alias('ls').description('List sessions')
  .action(() => {
    const list = sessions.all();
    if (!list.length) { console.log('No sessions.\n'); return; }
    console.log(`\n${'ID'.slice(0,14)} ${'Agent'.padEnd(14)} ${'Status'.padEnd(10)} ${'Created'}`);
    console.log('─'.repeat(55));
    for (const s of list) {
      const emoji = agentIcon(s.agentType);
      console.log(`${s.id.slice(0,14)} ${emoji + s.agentType.padEnd(13)} ${s.status.padEnd(10)} ${new Date(s.createdAt).toLocaleString()}`);
    }
    console.log('');
  });

program.parse();
