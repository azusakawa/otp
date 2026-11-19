import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('otp', {
  worktrees: {
    list: () => ipcRenderer.invoke('wt:list'),
    create: (name: string, repoPath: string) => ipcRenderer.invoke('wt:create', name, repoPath),
    delete: (id: string) => ipcRenderer.invoke('wt:delete', id),
  },
  sessions: {
    list: () => ipcRenderer.invoke('session:list'),
    create: (wtId: string, agent: 'opencode' | 'hermes') => ipcRenderer.invoke('session:create', wtId, agent),
    start: (id: string) => ipcRenderer.invoke('session:start', id),
    stop: (id: string) => ipcRenderer.invoke('session:stop', id),
    send: (id: string, msg: string) => ipcRenderer.invoke('session:send', id, msg),
    get: (id: string) => ipcRenderer.invoke('session:get', id),
    delete: (id: string) => ipcRenderer.invoke('session:delete', id),
  },
  onAgentOutput: (cb: (data: any) => void) => {
    ipcRenderer.on('agent-output', (_e, data) => cb(data));
  },
});
