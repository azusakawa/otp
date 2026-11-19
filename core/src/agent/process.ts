import { spawn, type ChildProcess } from 'node:child_process';
import type { AgentType } from '../types/index.js';
import { AGENT_CLI_BIN } from '../types/index.js';

/**
 * Represents a running agent process.
 * Provides stdin/stdout/stderr streams for communication.
 */
export interface AgentProcess {
  type: AgentType;
  pid: number;
  process: ChildProcess;
  cwd: string;
  stop(): void;
  write(data: string): void;
}

/**
 * Start an agent process in the given directory.
 * Returns a handle for stdin/stdout/stderr communication.
 */
export function startAgent(
  agentType: AgentType,
  worktreePath: string,
  env?: Record<string, string>,
): AgentProcess {
  const bin = AGENT_CLI_BIN[agentType];
  const envWithCwd = {
    ...process.env,
    ...env,
    ORCA_WORKTREE: worktreePath,
  };

  const proc = spawn(bin, [], {
    cwd: worktreePath,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: envWithCwd,
    shell: true,
  });

  return {
    type: agentType,
    pid: proc.pid!,
    process: proc,
    cwd: worktreePath,
    stop() {
      proc.kill('SIGTERM');
    },
    write(data) {
      if (proc.stdin && !proc.stdin.destroyed) {
        proc.stdin.write(data);
      }
    },
  };
}

/**
 * Kill an agent process by PID (e.g., if it was orphaned).
 */
export function killAgent(pid: number): void {
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // process already exited
  }
}
