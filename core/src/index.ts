export {
  agentName,
  agentIcon,
  agentCliBin,
  capabilities,
  generateId,
  type AgentTypeId,
  type MessageType,
  type Message,
  type Session,
  type Worktree,
  type AppConfig,
  type SessionStatus,
  // Zod schemas
  AgentTypeId as AgentTypeIdSchema,
  MessageSchema,
  SessionSchema,
  WorktreeSchema,
  AppConfigSchema,
  SessionStatusSchema,
  AgentName,
  AgentIcon,
  AgentCliBin,
  AgentCapabilities,
} from './types/schema.js';

export {
  type AgentType,
  AGENT_CLI_BIN,
  AGENT_DISPLAY_NAME,
  AGENT_ICON,
  type AgentCapability,
  AGENT_CAPABILITIES,
  type OrchestrationTask,
  DEFAULT_CONFIG,
} from './types/index.js';

export { SessionStore, WorktreeStore } from './stores.js';

export {
  runAgentTurn,
  killAgent,
  type AgentRun,
  type RunAgentTurnOpts,
} from './agent/process.js';

export { otpDataDir, otpWorktreesDir, otpScratchDir } from './config.js';

export { appendMessage } from './helpers/index.js';
