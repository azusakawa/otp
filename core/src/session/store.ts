import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Session, AgentType } from '../types/index.js';
import { createSession, generateId } from '../helpers/index.js';

/**
 * File-based session store.
 * Sessions are persisted one-per-file in the data dir.
 */
export class SessionStore {
  private dataDir: string;
  private sessions: Map<string, Session> = new Map();

  constructor(dataDir: string) {
    this.dataDir = dataDir.replace('~', process.env.HOME || process.env.USERPROFILE || '');
    this.ensureDir();
    this.loadAll();
  }

  private ensureDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private filePath(id: string): string {
    return join(this.dataDir, `session-${id}.json`);
  }

  private loadAll(): void {
    if (!existsSync(this.dataDir)) return;
    const files = require('node:fs').readdirSync(this.dataDir);
    for (const file of files) {
      if (file.startsWith('session-') && file.endsWith('.json')) {
        try {
          const raw = readFileSync(join(this.dataDir, file), 'utf-8');
          const s = JSON.parse(raw) as Session;
          this.sessions.set(s.id, s);
        } catch {
          // ignore corrupt files
        }
      }
    }
  }

  getAll(): Session[] {
    return Array.from(this.sessions.values());
  }

  getById(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  create(worktreeId: string, agentType: AgentType, cwd?: string): Session {
    const session = createSession(worktreeId, agentType, cwd);
    this.sessions.set(session.id, session);
    this.save(session);
    return session;
  }

  update(sessionId: string, fn: (s: Session) => void): boolean {
    const s = this.sessions.get(sessionId);
    if (!s) return false;
    fn(s);
    this.save(s);
    return true;
  }

  remove(id: string): boolean {
    const removed = this.sessions.delete(id);
    if (removed) {
      const fp = this.filePath(id);
      if (existsSync(fp)) {
        require('node:fs').unlinkSync(fp);
      }
    }
    return removed;
  }

  private save(session: Session): void {
    writeFileSync(this.filePath(session.id), JSON.stringify(session, null, 2), 'utf-8');
  }
}
