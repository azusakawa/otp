import { homedir } from 'node:os';
import { join } from 'node:path';

export function otpDataDir(): string {
  return join(homedir(), '.otp', 'data');
}

export function otpWorktreesDir(): string {
  return join(homedir(), '.otp', 'worktrees');
}
