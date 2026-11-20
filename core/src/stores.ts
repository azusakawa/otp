import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { SessionSchema, WorktreeSchema, generateId, type Session, type Worktree } from './types/schema.js';
import { otpWorktreesDir } from './config.js';

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
    const files = readdirSync(this.dataDir).filter((f) => f.startsWith('session-') && f.endsWith('.json'));
    for (const file of files) {
      try {
        const raw = readFileSync(join(this.dataDir, file), 'utf-8');
        const parsed = SessionSchema.parse(JSON.parse(raw));
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
    this.cache.set(s.id, s);
    this.persist(s);
    return s;
  }

  update(id: string, patch: Partial<Session>): Session | undefined {
    const existing = this.cache.get(id);
    if (!existing) return undefined;
    const updated: Session = { ...existing, ...patch, updatedAt: Date.now() };
    this.cache.set(id, updated);
    this.persist(updated);
    return updated;
  }

  delete(id: string): boolean {
    const ok = this.cache.delete(id);
    if (ok) {
      try {
        unlinkSync(join(this.dataDir, `session-${id}.json`));
      } catch {
        /* ignore */
      }
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
    const files = readdirSync(this.dataDir).filter((f) => f.startsWith('wt-') && f.endsWith('.json'));
    for (const file of files) {
      try {
        const raw = readFileSync(join(this.dataDir, file), 'utf-8');
        const parsed = WorktreeSchema.parse(JSON.parse(raw));
        this.cache.set(parsed.id, parsed);
      } catch {
        /* skip */
      }
    }
  }

  all(): Worktree[] {
    return [...this.cache.values()];
  }

  get(id: string): Worktree | undefined {
    return this.cache.get(id);
  }

  create(name: string, repoPath: string): Worktree {
    const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
    const targetPath = join(otpWorktreesDir(), sanitized);
    const branch = `otp-${sanitized}-${Date.now()}`;

    const verify = spawnSync('git', ['-C', repoPath, 'rev-parse', '--git-dir'], { encoding: 'utf-8' });
    if (verify.status !== 0) {
      throw new Error(`Not a git repo: ${repoPath}`);
    }

    const mainBranchRes = spawnSync('git', ['-C', repoPath, 'branch', '--show-current'], { encoding: 'utf-8' });
    const mainBranch = (mainBranchRes.stdout || '').trim() || 'main';

    mkdirSync(otpWorktreesDir(), { recursive: true });
    const add = spawnSync('git', ['-C', repoPath, 'worktree', 'add', '-b', branch, targetPath], { encoding: 'utf-8' });
    if (add.status !== 0) {
      const err = (add.stderr || add.stdout || '').trim();
      throw new Error(`git worktree add failed: ${err}`);
    }

    const wt: Worktree = {
      id: generateId(),
      name,
      path: targetPath,
      mainBranch,
      branch,
      repoPath,
      createdAt: Date.now(),
      sessionIds: [],
    };
    this.cache.set(wt.id, wt);
    this.persist(wt);
    return wt;
  }

  delete(id: string): boolean {
    const wt = this.cache.get(id);
    if (!wt) return false;

    if (wt.path) {
      try {
        spawnSync('git', ['-C', wt.path, 'worktree', 'remove', '--force', wt.path], { encoding: 'utf-8' });
      } catch {
        /* ignore */
      }
      if (existsSync(wt.path)) {
        try {
          rmSync(wt.path, { recursive: true, force: true });
        } catch {
          /* ignore */
        }
      }
    }

    // Remove the per-worktree branch (git worktree remove leaves it behind).
    if (wt.repoPath && wt.branch) {
      try {
        spawnSync('git', ['-C', wt.repoPath, 'branch', '-D', wt.branch], { encoding: 'utf-8' });
      } catch {
        /* ignore */
      }
    }

    this.cache.delete(id);
    try {
      unlinkSync(join(this.dataDir, `wt-${id}.json`));
    } catch {
      /* ignore */
    }
    return true;
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
