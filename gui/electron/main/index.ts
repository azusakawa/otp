import { app, BrowserWindow, ipcMain } from 'electron';
import { WorktreeStore, SessionStore, runAgentTurn, otpDataDir, otpScratchDir } from '@otp/core';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const dataDir = otpDataDir();
const worktrees = new WorktreeStore(dataDir);
const sessions = new SessionStore(dataDir);

const windows = new Set<BrowserWindow>();

function broadcast(channel: string, payload: unknown): void {
  for (const w of windows) w.webContents.send(channel, payload);
}

const running = new Map<string, { stop(): void }>();
const stopped = new Set<string>();

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  windows.add(win);
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    // __dirname = <gui>/dist/electron/main → up two levels is <gui>/dist
    win.loadFile(join(__dirname, '..', '..', 'renderer', 'index.html'));
  }
  win.on('closed', () => {
    windows.delete(win);
    win.removeAllListeners();
  });
}

// ── IPC: worktrees ───────────────────────────────────────────────────────

ipcMain.handle('wt:list', () => worktrees.all());
ipcMain.handle('wt:create', (_e, name: string, repoPath: string) => {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
  const expanded = repoPath.replace(/^~(?=$|[\\/])/, home);
  try {
    return worktrees.create(name, expanded);
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
});
ipcMain.handle('wt:delete', (_e, id: string) => worktrees.delete(id));

// ── IPC: sessions ────────────────────────────────────────────────────────

ipcMain.handle('session:list', () => sessions.all());

// wtId === null/undefined → quick session (no project): private scratch
// workspace at ~/.otp/scratch/<sessionId>/, git-initialized.
ipcMain.handle('session:create', (_e, wtId: string | null | undefined, agentType: 'opencode' | 'hermes') => {
  if (wtId) {
    const s = sessions.create(agentType, { worktreeId: wtId });
    worktrees.addSession(wtId, s.id);
    return s;
  }
  const id = randomUUID();
  const dir = join(otpScratchDir(), id);
  mkdirSync(dir, { recursive: true });
  spawnSync('git', ['init'], { cwd: dir, encoding: 'utf-8' });
  return sessions.create(agentType, { cwd: dir, id });
});

ipcMain.handle('session:run', async (_e, sessionId: string, prompt: string) => {
  const s = sessions.get(sessionId);
  if (!s) return { error: 'Session not found' };
  // Worktree sessions run in the worktree path; quick sessions in their
  // private scratch workspace (recorded as session.cwd at creation).
  let cwd: string;
  if (s.worktreeId) {
    const wt = worktrees.get(s.worktreeId);
    if (!wt) return { error: 'Worktree not found' };
    cwd = wt.path;
  } else {
    if (!s.cwd) return { error: 'Session has no working directory' };
    cwd = s.cwd;
  }
  if (running.has(sessionId)) return { error: 'Already running' };

  sessions.update(sessionId, {
    messages: [
      ...s.messages,
      { id: randomUUID(), role: 'user', content: prompt, timestamp: Date.now() },
    ],
    status: 'running',
  });

  let out = '';
  let agentSessionId: string | undefined = s.agentSessionId;
  const run = runAgentTurn({
    agentType: s.agentType,
    prompt,
    cwd,
    otpSessionId: s.id,
    agentSessionId: s.agentSessionId,
    onOutput: (chunk, label) => {
      if (label === 'agent') out += chunk;
      broadcast('agent-output', { session: sessionId, text: chunk, label });
    },
    onAgentSessionId: (id) => {
      agentSessionId = id;
    },
    onExit: (code) => {
      running.delete(sessionId);
      const wasStopped = stopped.delete(sessionId);
      const current = sessions.get(sessionId);
      if (!current) return; // session deleted while running
      sessions.update(sessionId, {
        messages: [
          ...(current?.messages ?? []),
          { id: randomUUID(), role: 'assistant', content: out, timestamp: Date.now() },
        ],
        status: code === 0 ? 'idle' : wasStopped ? 'idle' : 'error',
        pid: undefined,
        agentSessionId,
      });
      broadcast('session-updated', sessions.get(sessionId));
    },
  });

  running.set(sessionId, run);
  sessions.update(sessionId, { status: 'running', pid: run.pid, agentSessionId, cwd });
  broadcast('session-updated', sessions.get(sessionId));
  return { pid: run.pid };
});

ipcMain.handle('session:stop', (_e, sessionId: string) => {
  const run = running.get(sessionId);
  if (run) {
    stopped.add(sessionId);
    run.stop();
  }
  return { ok: true };
});

ipcMain.handle('session:get', (_e, sessionId: string) => sessions.get(sessionId));

ipcMain.handle('session:delete', (_e, sessionId: string) => {
  const run = running.get(sessionId);
  if (run) {
    stopped.add(sessionId);
    run.stop();
  }
  running.delete(sessionId);
  stopped.delete(sessionId);
  // Quick-session scratch workspaces are intentionally kept (artifacts may be
  // worth keeping); they are removed via scratch:clear.
  return sessions.delete(sessionId);
});

// ── IPC: scratch workspaces (quick sessions) ─────────────────────────────

// Removes every directory under ~/.otp/scratch (conversations are kept).
ipcMain.handle('scratch:clear', () => {
  const dir = otpScratchDir();
  if (!existsSync(dir)) return { cleared: 0 };
  let cleared = 0;
  for (const entry of readdirSync(dir)) {
    try {
      rmSync(join(dir, entry), { recursive: true, force: true });
      cleared++;
    } catch {
      /* ignore */
    }
  }
  return { cleared };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
app.on('will-quit', () => {
  for (const r of running.values()) r.stop();
});
