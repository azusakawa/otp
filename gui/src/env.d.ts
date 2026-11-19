declare global {
  interface Window {
    otp: {
      worktrees: {
        list(): Promise<any[]>;
        create(name: string, repoPath: string): Promise<any>;
        delete(id: string): Promise<boolean>;
      };
      sessions: {
        list(): Promise<any[]>;
        create(worktreeId: string, agentType: 'opencode' | 'hermes'): Promise<any>;
        start(sessionId: string): Promise<{ pid: number; status: string }>;
        stop(sessionId: string): Promise<{ status: string }>;
        send(sessionId: string, data: string): Promise<{ sent: boolean }>;
        get(sessionId: string): Promise<any | undefined>;
        delete(sessionId: string): Promise<boolean>;
      };
    };
  }
}

export {};
