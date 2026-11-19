interface Worktree {
  id: string; name: string; path: string; branch: string;
  mainBranch: string; createdAt: number; sessionIds: string[];
}

interface Message {
  id: string; role: 'user' | 'assistant' | 'system';
  content: string; timestamp: number;
}

interface Session {
  id: string; worktreeId: string; agentType: 'opencode' | 'hermes';
  status: 'idle' | 'running' | 'error'; messages: Message[];
  pid?: number; cwd?: string; createdAt: number; updatedAt: number;
}

declare global {
  interface Window {
    otp: {
      worktrees: {
        list(): Promise<Worktree[]>;
        create(name: string, repoPath: string): Promise<Worktree>;
        delete(id: string): Promise<boolean>;
      };
      sessions: {
        list(): Promise<Session[]>;
        create(wtId: string, agent: 'opencode' | 'hermes'): Promise<Session>;
        start(id: string): Promise<{ pid: number; error?: string }>;
        stop(id: string): Promise<{ ok: boolean }>;
        send(id: string, msg: string): Promise<{ ok: boolean }>;
        get(id: string): Promise<Session | undefined>;
        delete(id: string): Promise<boolean>;
      };
      onAgentOutput: (cb: (d: any) => void) => void;
    };
  }
}

export {};
