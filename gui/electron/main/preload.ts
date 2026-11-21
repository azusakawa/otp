import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('otp', {
  worktrees: {
    list: () => ipcRenderer.invoke('wt:list'),
    create: (name: string, repoPath: string) => ipcRenderer.invoke('wt:create', name, repoPath),
    delete: (id: string) => ipcRenderer.invoke('wt:delete', id),
  },
  sessions: {
    list: () => ipcRenderer.invoke('session:list'),
    create: (wtId: string | null, agent: 'opencode' | 'hermes') => ipcRenderer.invoke('session:create', wtId, agent),
    run: (id: string, prompt: string) => ipcRenderer.invoke('session:run', id, prompt),
    stop: (id: string) => ipcRenderer.invoke('session:stop', id),
    get: (id: string) => ipcRenderer.invoke('session:get', id),
    delete: (id: string) => ipcRenderer.invoke('session:delete', id),
  },
  scratch: {
    clear: () => ipcRenderer.invoke('scratch:clear'),
  },
  win: {
    minimize: () => ipcRenderer.send('win:minimize'),
    maximize: () => ipcRenderer.send('win:maximize'),
    close: () => ipcRenderer.send('win:close'),
  },
  onMaximized: (cb: (max: boolean) => void) => {
    ipcRenderer.on('win:maximized', (_e, max) => cb(max));
  },
  onAgentOutput: (cb: (data: any) => void) => {
    ipcRenderer.on('agent-output', (_e, data) => cb(data));
  },
  onSessionUpdated: (cb: (s: any) => void) => {
    ipcRenderer.on('session-updated', (_e, s) => cb(s));
  },
});
