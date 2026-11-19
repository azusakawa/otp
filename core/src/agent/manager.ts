import type { Session, AgentType, Worktree } from '../types/index.js';
import { SessionStore } from '../session/store.js';
import { WorktreeStore } from '../worktree/store.js';
import { startAgent, killAgent, type AgentProcess } from './process.js';
import { AGENT_CLI_BIN } from '../types/index.js';

/**
 * Manages the lifecycle of agents and their sessions.
 * Connects SessionStore + WorktreeStore + agent processes.
 */
export class AgentManager {
  private sessions: SessionStore;
  private worktrees: WorktreeStore;
  /** Running agent processes keyed by session ID */
  private runningAgents: Map<string, AgentProcess> = new Map();

  constructor(sessions: SessionStore, worktrees: WorktreeStore) {
    this.sessions = sessions;
    this.worktrees = worktrees;
  }

  /** Start an agent for a session */
  start(sessionId: string, env?: Record<string, string>): AgentProcess {
    const session = this.sessions.getById(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const worktree = this.worktrees.getById(session.worktreeId);
    if (!worktree) {
      throw new Error(`Worktree not found: ${session.worktreeId}`);
    }

    const bin = AGENT_CLI_BIN[session.agentType];

    // Start the agent CLI
    const proc = startAgent(session.agentType, worktree.path, {
      ...env,
      OTP_SESSION_ID: sessionId,
    });

    // Set up stdout/stderr handlers
    this.attachListeners(sessionId, proc);

    // Update session state
    this.sessions.update(sessionId, (s) => {
      s.status = 'running';
      s.pid = proc.pid;
    });

    this.runningAgents.set(sessionId, proc);
    return proc;
  }

  /** Stop a running agent */
  stop(sessionId: string): void {
    const agent = this.runningAgents.get(sessionId);
    if (agent) {
      agent.stop();
      this.runningAgents.delete(sessionId);
      this.sessions.update(sessionId, (s) => {
        s.status = 'idle';
        s.pid = undefined;
      });
    } else {
      // Fallback: kill by PID stored in session
      const session = this.sessions.getById(sessionId);
      if (session?.pid) {
        killAgent(session.pid);
        this.sessions.update(sessionId, (s) => {
          s.status = 'idle';
          s.pid = undefined;
        });
      }
    }
  }

  /** Check if an agent is running */
  isRunning(sessionId: string): boolean {
    return this.runningAgents.has(sessionId);
  }

  /** Send data to a running agent */
  send(sessionId: string, data: string): void {
    const agent = this.runningAgents.get(sessionId);
    if (agent) {
      agent.write(data);
    }
  }

  private attachListeners(sessionId: string, proc: AgentProcess): void {
    // Handle stdout
    proc.process.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      // In a real implementation, this would be streamed to the frontend
      // For now, just log for CLI usage
      process.stdout.write(text);
    });

    // Handle stderr
    proc.process.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      process.stderr.write(text);
    });

    // Handle exit
    proc.process.on('exit', (code) => {
      this.runningAgents.delete(sessionId);
      this.sessions.update(sessionId, (s) => {
        s.status = code === 0 ? 'idle' : 'error';
        s.pid = undefined;
      });
    });
  }
}
