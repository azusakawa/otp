import z from 'zod';

/* ── Agent Zod schemas ──────────────────────────────────────────────────── */

export const AgentTypeId = z.union([z.literal('opencode'), z.literal('hermes')]);
export type AgentTypeId = z.infer<typeof AgentTypeId>;

export const AgentName = z.object({
  opencode: z.literal('OpenCode'),
  hermes: z.literal('Hermes'),
});

export const AgentIcon = z.object({
  opencode: z.literal('🔵'),
  hermes: z.literal('🟣'),
});

export const AgentCliBin = z.object({
  opencode: z.literal('opencode'),
  hermes: z.literal('hermes'),
});

export const AgentCapabilities = z.object({
  opencode: z.object({
    chat: z.boolean(),
    terminal: z.boolean(),
  }),
  hermes: z.object({
    chat: z.boolean(),
    terminal: z.boolean(),
  }),
});

/* ── Message / Session Zod schemas ──────────────────────────────────────── */

export const MessageType = z.union([z.literal('user'), z.literal('assistant'), z.literal('system')]);
export type MessageType = z.infer<typeof MessageType>;

export const MessageSchema = z.object({
  id: z.string(),
  role: MessageType,
  content: z.string(),
  timestamp: z.number(),
});
export type Message = z.infer<typeof MessageSchema>;

export const SessionStatusSchema = z.union([
  z.literal('idle'),
  z.literal('running'),
  z.literal('paused'),
  z.literal('error'),
]);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  // Optional: quick ("idea") sessions have no worktree and run in a private
  // scratch workspace instead.
  worktreeId: z.string().optional(),
  agentType: AgentTypeId,
  status: SessionStatusSchema,
  messages: z.array(MessageSchema),
  pid: z.number().optional(),
  cwd: z.string().optional(),
  agentSessionId: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Session = z.infer<typeof SessionSchema>;

export const WorktreeSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  mainBranch: z.string(),
  branch: z.string(),
  repoPath: z.string().optional(),
  createdAt: z.number(),
  sessionIds: z.array(z.string()),
});
export type Worktree = z.infer<typeof WorktreeSchema>;

export const AppConfigSchema = z.object({
  defaultAgent: AgentTypeId,
  worktreesDir: z.string(),
  dataDir: z.string(),
  theme: z.union([z.literal('light'), z.literal('dark')]),
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

/* ── Helpers ────────────────────────────────────────────────────────────── */

import { randomUUID } from 'node:crypto';

export function generateId(): string {
  return randomUUID();
}

export function agentName(agentType: AgentTypeId): string {
  return AgentName.shape[agentType].value;
}

export function agentIcon(agentType: AgentTypeId): string {
  return AgentIcon.shape[agentType].value;
}

export function agentCliBin(agentType: AgentTypeId): string {
  return AgentCliBin.shape[agentType].value;
}

export const capabilities: Record<AgentTypeId, { chat: boolean; terminal: boolean }> = {
  opencode: { chat: true, terminal: true },
  hermes: { chat: true, terminal: true },
};
