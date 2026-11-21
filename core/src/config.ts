import { homedir } from 'node:os';
import { join } from 'node:path';

export function otpDataDir(): string {
  return join(homedir(), '.otp', 'data');
}

export function otpWorktreesDir(): string {
  return join(homedir(), '.otp', 'worktrees');
}

/**
 * Private per-session workspaces for quick ("idea") sessions that are not
 * bound to a project/worktree. Layout: <scratch>/<sessionId>/ (git repo).
 */
export function otpScratchDir(): string {
  return join(homedir(), '.otp', 'scratch');
}
