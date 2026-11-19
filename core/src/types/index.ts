// ── Agent Types ──────────────────────────────────────────────────────────

/** Registered agent type */
export type AgentType = 'opencode' | 'hermes';

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

// ── Session Types ────────────────────────────────────────────────────────

/** A single turn in a conversation */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/** Current session state */
/** Session status string literal union (canonical source) */
export type SessionStatus = 'idle' | 'running' | 'paused' | 'error';

/** A session = one agent conversation attached to a worktree */
export interface Session {
  id: string;
  worktreeId: string;
  agentType: AgentType;
  status: SessionStatus;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  /** PID of the running agent process, if any */
  pid?: number;
  /** Working directory override */
  cwd?: string;
}

// ── Worktree Types ───────────────────────────────────────────────────────

/** A Git worktree (isolated dev environment) */
export interface Worktree {
  id: string;
  name: string;
  path: string;
  /** Main branch */
  mainBranch: string;
  /** Worktree branch */
  branch: string;
  createdAt: number;
  /** Associated session IDs */
  sessionIds: string[];
}

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

/** User configuration */
export interface AppConfig {
  /** Default agent type */
  defaultAgent: AgentType;
  /** Worktrees base directory */
  worktreesDir: string;
  /** Data directory for session storage */
  dataDir: string;
  /** Theme: light | dark */
  theme: 'light' | 'dark';
}

export const DEFAULT_CONFIG: AppConfig = {
  defaultAgent: 'opencode',
  worktreesDir: '~/.otp/worktrees',
  dataDir: '~/.otp/data',
  theme: 'dark',
};
