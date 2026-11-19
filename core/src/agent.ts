import { spawn } from 'node:child_process';
import { agentCliBin } from './types/schema.js';

export interface AgentProcess {
  pid: number;
  stdin: import('node:stream').Writable;
  stdout: import('node:stream').Readable;
  stderr: import('node:stream').Readable;
  process: import('node:child_process').ChildProcess;
  stop(): void;
}

export function startAgent(agentType: 'opencode' | 'hermes', worktreePath: string): AgentProcess {
  const bin = agentCliBin(agentType);
  const proc = spawn(bin, [], {
    cwd: worktreePath,
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, OTP_AGENT: agentType },
  });

  return {
    pid: proc.pid!,
    stdin: proc.stdin,
    stdout: proc.stdout!,
    stderr: proc.stderr!,
    process: proc,
    stop() { proc.kill('SIGTERM'); },
  };
}
