// Schema (zod) is the single source for core data models.
export type {
  AgentTypeId,
  MessageType,
  Message,
  Session,
  Worktree,
  AppConfig,
  SessionStatus,
} from './schema.js';
import type { AppConfig } from './schema.js';

export { SessionSchema, WorktreeSchema, MessageSchema, AppConfigSchema, generateId } from './schema.js';

/** Registered agent type (alias of schema AgentTypeId). */
export type AgentType = import('./schema.js').AgentTypeId;

/** CLI binary name for each agent */
export const AGENT_CLI_BIN: Record<AgentType, string> = {
  opencode: 'opencode',
  hermes: 'hermes',
};

/** Human-readable display name */
export const AGENT_DISPLAY_NAME: Record<AgentType, string> = {
  opencode: 'OpenCode',
  hermes: 'Hermes',
};

/** Emoji icon for each agent */
export const AGENT_ICON: Record<AgentType, string> = {
  opencode: '🔵',
  hermes: '🟣',
};

/** Agent capabilities */
export interface AgentCapability {
  supportsChat: boolean;
  supportsTerminal: boolean;
  supportsOrchestration: boolean; // can spawn child workers
  supportsDesignMode: boolean;
}

export const AGENT_CAPABILITIES: Record<AgentType, AgentCapability> = {
  opencode: {
    supportsChat: true,
    supportsTerminal: true,
    supportsOrchestration: false,
    supportsDesignMode: false,
  },
  hermes: {
    supportsChat: true,
    supportsTerminal: true,
    supportsOrchestration: false,
    supportsDesignMode: false,
  },
};

// ── Orchestration Types ──────────────────────────────────────────────────

/** Task handed to a coordinator agent */
export interface OrchestrationTask {
  id: string;
  description: string;
  parentSessionId: string;
  /** Worker sessions created for this task */
  workerSessionIds: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: number;
}

// ── Config Types ─────────────────────────────────────────────────────────

export const DEFAULT_CONFIG: AppConfig = {
  defaultAgent: 'opencode',
  worktreesDir: '~/.otp/worktrees',
  dataDir: '~/.otp/data',
  theme: 'dark',
};
