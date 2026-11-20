import { app, BrowserWindow, ipcMain } from 'electron';
import { WorktreeStore, SessionStore, runAgentTurn, otpDataDir } from '@otp/core';
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

ipcMain.handle('session:create', (_e, wtId: string, agentType: 'opencode' | 'hermes') => {
  const s = sessions.create(wtId, agentType);
  worktrees.addSession(wtId, s.id);
  return s;
});

ipcMain.handle('session:run', async (_e, sessionId: string, prompt: string) => {
  const s = sessions.get(sessionId);
  if (!s) return { error: 'Session not found' };
  const wt = worktrees.get(s.worktreeId);
  if (!wt) return { error: 'Worktree not found' };
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
    cwd: wt.path,
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
  sessions.update(sessionId, { status: 'running', pid: run.pid, agentSessionId, cwd: wt.path });
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
  return sessions.delete(sessionId);
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
