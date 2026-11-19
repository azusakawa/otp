import type { AgentType, Session, Worktree, Message } from '../types/index.js';

/** Lightweight ID generator */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Create a new session */
export function createSession(
  worktreeId: string,
  agentType: AgentType,
  cwd?: string,
): Session {
  const now = Date.now();
  return {
    id: generateId(),
    worktreeId,
    agentType,
    status: 'idle',
    messages: [],
    createdAt: now,
    updatedAt: now,
    cwd,
  };
}

/** Add a message to a session (mutates in place) */
export function appendMessage(
  session: Session,
  role: Message['role'],
  content: string,
): void {
  const msg: Message = {
    id: generateId(),
    role,
    content,
    timestamp: Date.now(),
  };
  session.messages.push(msg);
  session.updatedAt = Date.now();
}

/** Create a worktree record */
export function createWorktree(
  name: string,
  path: string,
  mainBranch = 'main',
): Worktree {
  const now = Date.now();
  const branch = `otp-${name.replace(/\s+/g, '-')}-${now}`;
  return {
    id: generateId(),
    name,
    path,
    mainBranch,
    branch,
    createdAt: now,
    sessionIds: [],
  };
}

/** Git worktree path helper — given repo path and worktree name, returns the new worktree path */
export function resolveWorktreePath(
  repoPath: string,
  worktreeName: string,
): string {
  const sanitizedName = worktreeName.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
  return `${repoPath}/.otp-worktrees/${sanitizedName}`;
}
