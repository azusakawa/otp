import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { SessionSchema, WorktreeSchema, type Session, type Worktree, generateId } from './schema.js';

/* ── SessionStore ───────────────────────────────────────────────────────── */

export class SessionStore {
  private dataDir: string;
  private cache = new Map<string, Session>();

  constructor(dataDir: string) {
    this.dataDir = dataDir.replace(/^~/, process.env.HOME ?? process.env.USERPROFILE ?? '');
    this.load();
  }

  private load(): void {
    this.cache.clear();
    if (!existsSync(this.dataDir)) return;
    const files = readdirSync(this.dataDir).filter(f => f.startsWith('session-') && f.endsWith('.json'));
    for (const file of files) {
      try {
        const raw = readFileSync(join(this.dataDir, file), 'utf-8');
        const val = JSON.parse(raw);
        const parsed = SessionSchema.parse(val);
        this.cache.set(parsed.id, parsed);
      } catch {
        /* skip corrupt */
      }
    }
  }

  all(): Session[] {
    return [...this.cache.values()];
  }

  get(id: string): Session | undefined {
    return this.cache.get(id);
  }

  create(worktreeId: string, agentType: 'opencode' | 'hermes', cwd?: string): Session {
    const s: Session = {
      id: generateId(),
      worktreeId,
      agentType,
      status: 'idle',
      messages: [],
      cwd,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.persist(s);
    return s;
  }

  update(id: string, patch: Partial<Session>): Session | undefined {
    const existing = this.cache.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, updatedAt: Date.now() };
    this.cache.set(id, updated);
    this.persist(updated);
    return updated;
  }

  delete(id: string): boolean {
    const ok = this.cache.delete(id);
    if (ok) {
      try { unlinkSync(join(this.dataDir, `session-${id}.json`)); } catch { /* ignore */ }
    }
    return ok;
  }

  private persist(s: Session): void {
    if (!existsSync(this.dataDir)) mkdirSync(this.dataDir, { recursive: true });
    writeFileSync(join(this.dataDir, `session-${s.id}.json`), JSON.stringify(s, null, 2), 'utf-8');
  }
}

/* ── WorktreeStore ──────────────────────────────────────────────────────── */

export class WorktreeStore {
  private dataDir: string;
  private cache = new Map<string, Worktree>();

  constructor(dataDir: string) {
    this.dataDir = dataDir.replace(/^~/, process.env.HOME ?? process.env.USERPROFILE ?? '');
    this.load();
  }

  private load(): void {
    this.cache.clear();
    if (!existsSync(this.dataDir)) return;
    const files = readdirSync(this.dataDir).filter(f => f.startsWith('wt-') && f.endsWith('.json'));
    for (const file of files) {
      try {
        const raw = readFileSync(join(this.dataDir, file), 'utf-8');
        const val = JSON.parse(raw);
        const parsed = WorktreeSchema.parse(val);
        this.cache.set(parsed.id, parsed);
      } catch { /* skip */ }
    }
  }

  all(): Worktree[] {
    return [...this.cache.values()];
  }

  get(id: string): Worktree | undefined {
    return this.cache.get(id);
  }

  create(name: string, path: string, mainBranch = 'main'): Worktree {
    const branch = `otp-${name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()}-${Date.now()}`;
    const wt: Worktree = {
      id: generateId(),
      name,
      path,
      mainBranch,
      branch,
      createdAt: Date.now(),
      sessionIds: [],
    };
    this.persist(wt);
    return wt;
  }

  delete(id: string): boolean {
    const ok = this.cache.delete(id);
    if (ok) {
      try { unlinkSync(join(this.dataDir, `wt-${id}.json`)); } catch { /* ignore */ }
    }
    return ok;
  }

  addSession(worktreeId: string, sessionId: string): boolean {
    const wt = this.cache.get(worktreeId);
    if (!wt || wt.sessionIds.includes(sessionId)) return false;
    wt.sessionIds.push(sessionId);
    this.persist(wt);
    return true;
  }

  private persist(wt: Worktree): void {
    if (!existsSync(this.dataDir)) mkdirSync(this.dataDir, { recursive: true });
    writeFileSync(join(this.dataDir, `wt-${wt.id}.json`), JSON.stringify(wt, null, 2), 'utf-8');
  }
}
