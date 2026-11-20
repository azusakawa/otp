import { app, BrowserWindow, ipcMain } from 'electron';
import { WorktreeStore, SessionStore, startAgent, agentName, agentIcon } from '@otp/core';
import { join } from 'node:path';
import type { AgentProcess } from '@otp/core/agent.js';

const dataDir = join(app.getPath('appData'), 'otp', 'data');
const worktrees = new WorktreeStore(dataDir);
const sessions = new SessionStore(dataDir);
const agents = new Map<string, AgentProcess>();

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400, height: 900,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    // __dirname = <gui>/dist/electron/main → up two levels is <gui>/dist
    win.loadFile(join(__dirname, '..', '..', 'renderer', 'index.html'));
  }
  win.on('closed', () => { win.removeAllListeners(); });
}

// ── IPC: worktrees ───────────────────────────────────────────────────────

ipcMain.handle('wt:list', () => worktrees.all());
ipcMain.handle('wt:create', (_e, name: string, repoPath: string) => worktrees.create(name, repoPath));
ipcMain.handle('wt:delete', (_e, id: string) => worktrees.delete(id));

// ── IPC: sessions ────────────────────────────────────────────────────────

ipcMain.handle('session:list', () => sessions.all());

ipcMain.handle('session:create', (_e, wtId: string, agentType: 'opencode' | 'hermes') => {
  const s = sessions.create(wtId, agentType);
  worktrees.addSession(wtId, s.id);
  return s;
});

ipcMain.handle('session:start', async (_e, sessionId: string) => {
  const s = sessions.get(sessionId);
  if (!s) return { error: 'Session not found' };
  const wt = worktrees.get(s.worktreeId);
  if (!wt) return { error: 'Worktree not found' };
  if (agents.has(sessionId)) return { error: 'Already running' };

  const proc = startAgent(s.agentType, wt.path);
  agents.set(sessionId, proc);
  sessions.update(sessionId, { status: 'running', pid: proc.pid, cwd: wt.path });

  proc.stdout.on('data', (chunk: Buffer) => {
    const text = chunk.toString();
    if (text.trim()) {
      const data = { text, session: sessionId, label: 'agent' } as any;
      // Broadcast to all renderer windows via EventEmitter
      const broadcast = (app as any).getActiveWindow()?.webContents?.send('agent-output', data);
    }
  });

  proc.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString();
    if (text.trim()) {
      const data = { text, session: sessionId, label: 'error' } as any;
      const broadcast = (app as any).getActiveWindow()?.webContents?.send('agent-output', data);
    }
  });

  proc.process.on('exit', (code: number) => {
    agents.delete(sessionId);
    sessions.update(sessionId, { status: code === 0 ? 'idle' : 'error', pid: undefined });
  });

  return { pid: proc.pid };
});

ipcMain.handle('session:stop', (_e, sessionId: string) => {
  const proc = agents.get(sessionId);
  if (proc) { proc.stop(); agents.delete(sessionId); }
  sessions.update(sessionId, { status: 'idle', pid: undefined });
  return { ok: true };
});

ipcMain.handle('session:send', (_e, sessionId: string, message: string) => {
  const proc = agents.get(sessionId);
  if (!proc) return { ok: false, error: 'Not running' };
  proc.stdin.write(message + '\n');
  sessions.update(sessionId, {
    messages: [...(sessions.get(sessionId)?.messages ?? []), {
      id: Date.now().toString(), role: 'user', content: message, timestamp: Date.now(),
    }],
    updatedAt: Date.now(),
  });
  return { ok: true };
});

ipcMain.handle('session:get', (_e, sessionId: string) => sessions.get(sessionId));

ipcMain.handle('session:delete', (_e, sessionId: string) => sessions.delete(sessionId));

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
