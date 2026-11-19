import { spawn, type ChildProcess } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { AppConfig } from '../types/index.js';
import { DEFAULT_CONFIG } from '../types/index.js';
import { createWorktree, createSession } from '../helpers/index.js';
import type { Worktree, Session, AgentType } from '../types/index.js';

/**
 * File-based worktree store.
 * Each worktree is persisted as a JSON file in the data dir.
 */
export class WorktreeStore {
  private dataDir: string;
  private worktrees: Map<string, Worktree> = new Map();

  constructor(config: Partial<AppConfig> = {}) {
    const resolved = { ...DEFAULT_CONFIG, ...config };
    this.dataDir = resolved.dataDir.replace('~', process.env.HOME || process.env.USERPROFILE || '');
    this.ensureDir();
    this.loadAll();
  }

  private ensureDir(): void {
    if (!existsSync(this.dataDir)) {
      mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private filePath(id: string): string {
    return join(this.dataDir, `worktree-${id}.json`);
  }

  private loadAll(): void {
    if (!existsSync(this.dataDir)) return;
    const files = require('node:fs').readdirSync(this.dataDir);
    for (const file of files) {
      if (file.startsWith('worktree-') && file.endsWith('.json')) {
        try {
          const raw = readFileSync(join(this.dataDir, file), 'utf-8');
          const wt = JSON.parse(raw) as Worktree;
          this.worktrees.set(wt.id, wt);
        } catch {
          // ignore corrupt files
        }
      }
    }
  }

  getAll(): Worktree[] {
    return Array.from(this.worktrees.values());
  }

  getById(id: string): Worktree | undefined {
    return this.worktrees.get(id);
  }

  /** Create a worktree — does NOT run git worktree create, just records it */
  create(name: string, path: string): Worktree {
    const wt = createWorktree(name, path);
    this.worktrees.set(wt.id, wt);
    this.save(wt);
    return wt;
  }

  remove(id: string): boolean {
    const removed = this.worktrees.delete(id);
    if (removed) {
      const fp = this.filePath(id);
      if (existsSync(fp)) {
        require('node:fs').unlinkSync(fp);
      }
    }
    return removed;
  }

  private save(wt: Worktree): void {
    writeFileSync(this.filePath(wt.id), JSON.stringify(wt, null, 2), 'utf-8');
  }

  /** Add a session to a worktree's session list */
  addSession(worktreeId: string, sessionId: string): boolean {
    const wt = this.worktrees.get(worktreeId);
    if (!wt) return false;
    if (!wt.sessionIds.includes(sessionId)) {
      wt.sessionIds.push(sessionId);
      this.save(wt);
    }
    return true;
  }
}
