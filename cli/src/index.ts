#!/usr/bin/env node
import { Command } from 'commander';
import { WorktreeStore, SessionStore, agentName, agentIcon, runAgentTurn, killAgent, otpDataDir, otpScratchDir } from '@otp/core';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const DATA_DIR = otpDataDir();
const wts = new WorktreeStore(DATA_DIR);
const sessions = new SessionStore(DATA_DIR);

const program = new Command();

program
  .name('otp')
  .description('Personal AI coding agent orchestrator (one-shot run model)')
  .version('0.1.0');

// ── worktree ──────────────────────────────────────────────────────────────
program
  .command('worktree <name>')
  .description('Create a git worktree for an agent run')
  .option('-r, --repo <path>', 'Git repo path', process.cwd())
  .action((name, opts) => {
    try {
      const wt = wts.create(name, opts.repo);
      console.log(`\n✓ Created worktree: ${wt.name}`);
      console.log(`  ID:       ${wt.id}`);
      console.log(`  Path:     ${wt.path}`);
      if (wt.repoPath) console.log(`  Repo:     ${wt.repoPath}`);
      console.log(`  Branch:   ${wt.branch}`);
      console.log(`  Sessions: ${wt.sessionIds.length}`);
      console.log(`\n  otp session:create -w ${wt.id} -a hermes\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ Failed to create worktree: ${msg}\n`);
      process.exit(1);
    }
  });

program
  .command('worktree:ls')
  .alias('ls')
  .description('List worktrees')
  .action(() => {
    const list = wts.all();
    if (!list.length) {
      console.log('No worktrees.\n');
      return;
    }
    console.log(
      `\n${'Name'.padEnd(18)} ${'ID'.slice(0, 14).padEnd(14)} ${'Repo'.padEnd(28)} ${'Branch'.padEnd(28)} Sessions`,
    );
    console.log('─'.repeat(100));
    for (const w of list) {
      const repo = w.repoPath ?? '';
      console.log(
        `${w.name.padEnd(18)} ${w.id.slice(0, 14).padEnd(14)} ${repo.slice(-28).padEnd(28)} ${w.branch.padEnd(28)} ${w.sessionIds.length}`,
      );
    }
    console.log('');
  });

program
  .command('worktree:rm <id>')
  .alias('delete')
  .description('Remove a worktree (stops any running sessions first)')
  .action((id) => {
    const wt = wts.get(id);
    if (!wt) {
      console.error(`✗ Not found: ${id}\n`);
      process.exit(1);
    }
    for (const sid of wt.sessionIds) {
      const s = sessions.get(sid);
      if (s && (s.status === 'running' || s.pid)) {
        console.log(`! Stopping running session ${s.id} (pid: ${s.pid ?? 'n/a'}) before removing worktree...`);
        if (s.pid) {
          try {
            killAgent(s.pid);
          } catch {
            /* ignore */
          }
        }
        sessions.update(s.id, { status: 'idle', pid: undefined });
      }
    }
    if (wts.delete(id)) console.log(`✓ Removed: ${id}\n`);
    else console.error(`✗ Failed to remove: ${id}\n`);
  });

// ── session ───────────────────────────────────────────────────────────────
program.command('session').description('Manage sessions');

program
  .command('session:create')
  .description('Create a new session (for a worktree, or project-free via --quick)')
  .option('-w, --worktree-id <id>', 'Worktree ID')
  .option('--quick', 'Quick session without a project (private scratch workspace)')
  .option('-a, --agent <type>', 'Agent type (opencode|hermes)', 'opencode')
  .action((opts) => {
    const agent = opts.agent as 'opencode' | 'hermes';
    if (opts.quick) {
      const id = randomUUID();
      const dir = join(otpScratchDir(), id);
      mkdirSync(dir, { recursive: true });
      spawnSync('git', ['init'], { cwd: dir, encoding: 'utf-8' });
      const s = sessions.create(agent, { cwd: dir, id });
      console.log(`\n✓ Created quick session (no project): ${s.id}`);
      console.log(`  Agent:  ${opts.agent}`);
      console.log(`  Cwd:    ${s.cwd}`);
      console.log(`  Status: ${s.status}`);
      console.log(`  Run:    otp session:run ${s.id} -p "your prompt"\n`);
      return;
    }
    if (!opts.worktreeId) {
      console.error('Error: --worktree-id or --quick required\n');
      process.exit(1);
    }
    const wt = wts.get(opts.worktreeId);
    if (!wt) {
      console.error(`✗ Worktree not found: ${opts.worktreeId}\n`);
      process.exit(1);
    }
    const s = sessions.create(agent, { worktreeId: wt.id, cwd: wt.path });
    wts.addSession(wt.id, s.id);
    console.log(`\n✓ Created session: ${s.id}`);
    console.log(`  Agent:  ${opts.agent}`);
    console.log(`  Wt:     ${wt.name}`);
    console.log(`  Status: ${s.status}`);
    console.log(`  Run:    otp session:run ${s.id} -p "your prompt"\n`);
  });

program
  .command('session:run <id>')
  .description('Run a one-shot agent turn for a session (blocks until exit)')
  .requiredOption('-p, --prompt <text>', 'Prompt to send to the agent')
  .action(async (id, opts) => {
    const s = sessions.get(id);
    if (!s) {
      console.error(`✗ Session not found: ${id}\n`);
      process.exit(1);
    }
    // Worktree sessions run in the worktree path; quick sessions in their
    // private scratch workspace (recorded as session.cwd at creation).
    let cwd: string;
    if (s.worktreeId) {
      const wt = wts.get(s.worktreeId);
      if (!wt) {
        console.error(`✗ Worktree not found: ${s.worktreeId}\n`);
        process.exit(1);
      }
      cwd = wt.path;
    } else {
      if (!s.cwd) {
        console.error('✗ Session has no working directory\n');
        process.exit(1);
      }
      cwd = s.cwd;
    }

    const prompt = String(opts.prompt);
    const timestamp = Date.now();
    const userMessage = {
      id: randomUUID(),
      role: 'user' as const,
      content: prompt,
      timestamp,
    };
    sessions.update(id, { messages: [...s.messages, userMessage] });

    console.log(
      `\n▶ Running session ${s.id} | agent: ${agentName(s.agentType)} ${agentIcon(s.agentType)} | cwd: ${cwd}\n`,
    );

    let stdoutAll = '';
    let latestAgentSessionId: string | undefined = s.agentSessionId;
    let exitCode: number | null = null;

    const exitPromise = new Promise<void>((resolve) => {
      const run = runAgentTurn({
        agentType: s.agentType,
        prompt,
        cwd,
        otpSessionId: s.id,
        agentSessionId: s.agentSessionId,
        onOutput: (chunk, label) => {
          if (label === 'agent') {
            process.stdout.write(chunk);
            stdoutAll += chunk;
          } else {
            process.stderr.write(chunk);
          }
        },
        onAgentSessionId: (agentSessionId) => {
          latestAgentSessionId = agentSessionId;
        },
        onExit: (code) => {
          exitCode = code;
          resolve();
        },
      });

      sessions.update(id, {
        status: 'running',
        pid: run.pid,
        agentSessionId: latestAgentSessionId ?? s.agentSessionId,
        cwd,
      });
    });

    await exitPromise;

    const assistantMessage = {
      id: randomUUID(),
      role: 'assistant' as const,
      content: stdoutAll,
      timestamp: Date.now(),
    };
    const current = sessions.get(id);
    const messages = [...(current?.messages ?? []), assistantMessage];
    const status = exitCode === 0 ? 'idle' : 'error';
    sessions.update(id, {
      messages,
      status,
      pid: undefined,
      agentSessionId: latestAgentSessionId,
    });

    console.log(`\n■ Session ${id} exited with code ${exitCode} (status: ${status})\n`);
    if (exitCode !== 0) process.exitCode = exitCode ?? 1;
  });

program
  .command('session:stop <id>')
  .description('Stop a running session agent')
  .action((id) => {
    const s = sessions.get(id);
    if (!s) {
      console.error(`✗ Session not found: ${id}\n`);
      process.exit(1);
    }
    if (s.pid) {
      try {
        killAgent(s.pid);
      } catch {
        /* ignore */
      }
    }
    sessions.update(id, { status: 'idle', pid: undefined });
    console.log(`✓ Stopped: ${id}\n`);
  });

program
  .command('session:ls')
  .description('List sessions')
  .action(() => {
    const list = sessions.all();
    if (!list.length) {
      console.log('No sessions.\n');
      return;
    }
    console.log(`\n${'ID'.slice(0, 14).padEnd(14)} ${'Agent'.padEnd(14)} ${'Status'.padEnd(10)} ${'Created'}`);
    console.log('─'.repeat(60));
    for (const s of list) {
      const emoji = agentIcon(s.agentType);
      console.log(
        `${s.id.slice(0, 14).padEnd(14)} ${(emoji + ' ' + s.agentType).padEnd(14)} ${s.status.padEnd(10)} ${new Date(s.createdAt).toLocaleString()}`,
      );
    }
    console.log('');
  });

program
  .command('scratch:clear')
  .description('Remove all quick-session scratch workspaces (conversations are kept)')
  .action(() => {
    const dir = otpScratchDir();
    if (!existsSync(dir)) {
      console.log('Nothing to clear.\n');
      return;
    }
    let cleared = 0;
    for (const entry of readdirSync(dir)) {
      try {
        rmSync(join(dir, entry), { recursive: true, force: true });
        cleared++;
      } catch {
        /* ignore */
      }
    }
    console.log(`✓ Cleared ${cleared} scratch workspace(s)\n`);
  });

program.parse();
