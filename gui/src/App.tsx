import { useState, useEffect, useRef } from 'react';

interface Worktree {
  id: string; name: string; path: string; branch: string;
  mainBranch: string; createdAt: number; sessionIds: string[];
}

interface Message {
  id: string; role: 'user' | 'assistant' | 'system';
  content: string; timestamp: number;
}

interface Session {
  id: string; worktreeId: string; agentType: 'opencode' | 'hermes';
  status: 'idle' | 'running' | 'error'; messages: Message[];
  pid?: number; cwd?: string; createdAt: number; updatedAt: number;
}

declare global {
  interface Window {
    otp: {
      worktrees: { list(): Promise<Worktree[]>; create(n: string, p: string): Promise<Worktree>; delete(id: string): Promise<boolean> };
      sessions: {
        list(): Promise<Session[]>;
        create(wtId: string, agent: 'opencode' | 'hermes'): Promise<Session>;
        start(id: string): Promise<{ pid: number; error?: string }>;
        stop(id: string): Promise<{ ok: boolean }>;
        send(id: string, msg: string): Promise<{ ok: boolean }>;
        get(id: string): Promise<Session | undefined>;
        delete(id: string): Promise<boolean>;
      };
      onAgentOutput: (cb: (d: any) => void) => void;
    };
  }
}

const AGENT_INFO: Record<string, { name: string; icon: string; color: string }> = {
  opencode: { name: 'OpenCode', icon: '🔵', color: '#3b82f6' },
  hermes:   { name: 'Hermes',   icon: '🟣', color: '#8b5cf6' },
};

/* ── Modal ──────────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

/* ── Sidebar ────────────────────────────────────────────────────────────── */
function Sidebar({
  worktrees, sessions, activeId, onSelect, onCreateWt, onOpenCreateWt, onNewSession,
  onStart, onStop, onDeleteWt, onDeleteSession,
}: {
  worktrees: Worktree[]; sessions: Session[]; activeId: string | null;
  onSelect: (id: string) => void; onCreateWt: () => void; onOpenCreateWt: () => void;
  onNewSession: (wtId: string, agent: 'opencode' | 'hermes') => void;
  onStart: (id: string) => void; onStop: (id: string) => void;
  onDeleteWt: (id: string) => void; onDeleteSession: (id: string) => void;
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>🐙 OTP</h1>
        <button className="btn btn-sm" onClick={onOpenCreateWt}>+ 任務樹</button>
      </div>

      <div className="sidebar-section">任務樹 ({worktrees.length})</div>
      <div className="sidebar-content">
        {worktrees.length === 0 && <div style={{ padding: '12px 0', fontSize: 12, color: '#8b949e' }}>點擊「+ 任務樹」建立</div>}
        {worktrees.map(wt => (
          <div className="card" key={wt.id} onClick={() => onSelect(wt.id)}>
            <div className="card-title">{wt.name}</div>
            <div className="card-meta">{wt.branch}</div>
            <div className="card-actions">
              <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onNewSession(wt.id, 'opencode'); }}>🔵 OpenCode</button>
              <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onNewSession(wt.id, 'hermes'); }}>🟣 Hermes</button>
              <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); onDeleteWt(wt.id); }}>✕</button>
            </div>
          </div>
        ))}

        <div className="sidebar-section">工作階段 ({sessions.length})</div>
        {sessions.length === 0 && <div style={{ padding: '8px 0', fontSize: 12, color: '#8b949e' }}>建立任務樹後自動顯示</div>}
        {sessions.map(s => {
          const ai = AGENT_INFO[s.agentType];
          return (
            <div className={`card ${activeId === s.id ? 'active' : ''}`} key={s.id} onClick={() => onSelect(s.id)}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 12 }}>{ai.icon} {ai.name}</span>
                <span className={`badge badge-${s.status}`}>
                  {s.status === 'running' ? '● 執行中' : s.status === 'error' ? '✕ 錯誤' : '○ 閒置'}
                </span>
              </div>
              <div className="card-meta">{s.messages.length} 則訊息</div>
              <div className="card-actions">
                {s.status === 'idle' && (
                  <button className="btn btn-sm btn-primary" onClick={e => { e.stopPropagation(); onStart(s.id); }}>▶ 啟動</button>
                )}
                {s.status === 'running' && (
                  <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); onStop(s.id); }}>⏹ 停止</button>
                )}
                <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onNewSession(s.worktreeId, s.agentType); }}>+ 副本</button>
                <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); onDeleteSession(s.id); }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Chat ───────────────────────────────────────────────────────────────── */
function Chat({ session, onSend, onStop }: {
  session: Session | null; onSend: (msg: string) => void; onStop: () => void;
}) {
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [session?.messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) { onSend(input.trim()); setInput(''); }
  };

  if (!session) {
    return (
      <div className="empty">
        <div className="empty-icon">🐙</div>
        <div className="empty-text">歡迎使用 OTP</div>
        <div className="empty-hint">左側建立任務樹 → 選智能體 → 啟動開始協作</div>
      </div>
    );
  }

  const ai = AGENT_INFO[session.agentType];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="toolbar">
        <span className="agent-badge">{ai.icon}</span>
        <span style={{ fontWeight: 600 }}>{ai.name}</span>
        <span className={`badge badge-${session.status}`} style={{ marginLeft: 8 }}>
          {session.status === 'running' ? '● 執行中' : session.status === 'error' ? '✕ 錯誤' : '○ 閒置'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8b949e' }}>
          PID: {session.pid ?? '—'}
        </span>
        {session.status === 'running' && (
          <button className="btn btn-danger btn-sm" onClick={onStop}>停止</button>
        )}
      </div>

      {/* Messages */}
      <div className="chat" ref={chatRef}>
        {session.messages.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#8b949e', fontSize: 13 }}>
            沒有對話，輸入訊息開始協作
          </div>
        )}
        {session.messages.map((m) => (
          <div className={`msg msg-${m.role}`} key={m.id}>
            <div className="msg-role">{m.role}</div>
            <div className="msg-bubble">{m.content}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input">
        <form className="chat-input-wrap" onSubmit={submit}>
          <textarea
            placeholder={session.status === 'running' ? '輸入訊息發送給智能體...' : '啟動後可發送訊息'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e); } }}
            rows={2}
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim()}>發送 →</button>
        </form>
      </div>
    </div>
  );
}

/* ── Diff Panel ─────────────────────────────────────────────────────────── */
function DiffPanel({ worktree }: { worktree: Worktree | undefined }) {
  const [diffs, setDiffs] = useState<any[]>([]);

  useEffect(() => {
    // In a real implementation this would call git diff via IPC
    // For now, placeholder
    setDiffs([]);
  }, [worktree]);

  if (!worktree) return null;

  return (
    <div className="diff-panel">
      <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>📋 變更 {worktree.name}</div>
      {diffs.length === 0 && <div style={{ color: '#8b949e', fontSize: 12 }}>暫無變更</div>}
      {diffs.map((d: any, i: number) => (
        <div className="diff-file" key={i}>
          <div className="diff-file-name">{d.file}</div>
          <div className="diff-hunk">
            {d.hunks?.map((h: any, j: number) => (
              <div key={j}>
                {h.adds?.map((a: string) => <div className="diff-add" key={j+'a'}>+ {a}</div>)}
                {h.deletes?.map((dl: string) => <div className="diff-del" key={j+'d'}>- {dl}</div>)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Terminal ───────────────────────────────────────────────────────────── */
function TerminalPanel({ session }: { session: Session | null }) {
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!termRef.current) return;
    // xterm.js would be mounted here
    // For now, show output log
  }, [session]);

  return (
    <div className="terminal">
      <div className="terminal-header">終端輸出</div>
      <div ref={termRef} style={{
        padding: '8px 12px', fontFamily: 'monospace', fontSize: 12,
        overflow: 'auto', height: '100%', color: '#c9d1d9',
      }}>
        {session?.status === 'running' ? (
          <div style={{ color: '#8b949e' }}>等待智能體輸出...</div>
        ) : (
          <div style={{ color: '#8b949e' }}>啟動智能體後在此顯示輸出</div>
        )}
      </div>
    </div>
  );
}

/* ── App ────────────────────────────────────────────────────────────────── */
function App() {
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeWtId, setActiveWtId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [wtName, setWtName] = useState('');
  const [wtPath, setWtPath] = useState('');

  const activeWt = worktrees.find(w => w.id === activeWtId);
  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  // Listen for agent output
  useEffect(() => {
    window.otp.onAgentOutput((data) => {
      if (data.session === activeSessionId) {
        setSessions(prev => prev.map(s => {
          if (s.id !== data.session) return s;
          const role = data.label === 'error' ? 'system' as const : 'assistant' as const;
          return { ...s, messages: [...s.messages, {
            id: `${Date.now()}-${Math.random()}`, role, content: data.text, timestamp: Date.now(),
          }], updatedAt: Date.now() };
        }));
      }
    });
  }, [activeSessionId]);

  const refresh = async () => {
    const [wt, ss] = await Promise.all([
      window.otp.worktrees.list(),
      window.otp.sessions.list(),
    ]);
    setWorktrees(wt);
    setSessions(ss);
  };

  const handleCreateWt = async () => {
    if (!wtName.trim() || !wtPath.trim()) return;
    const wt = await window.otp.worktrees.create(wtName.trim(), wtPath.trim());
    setWtName(''); setWtPath(''); setShowModal(false);
    await refresh();
  };

  const handleDeleteWt = async (id: string) => {
    await window.otp.worktrees.delete(id);
    await refresh();
  };

  const handleNewSession = async (wtId: string, agent: 'opencode' | 'hermes') => {
    const s = await window.otp.sessions.create(wtId, agent);
    await refresh();
    setActiveSessionId(s.id);
    setActiveWtId(wtId);
  };

  const handleStart = async (id: string) => {
    await window.otp.sessions.start(id);
    await refresh();
  };

  const handleStop = async (id: string) => {
    await window.otp.sessions.stop(id);
    await refresh();
  };

  const handleSend = async (msg: string) => {
    if (!activeSessionId) return;
    await window.otp.sessions.send(activeSessionId, msg);
  };

  const handleDeleteSession = async (id: string) => {
    await window.otp.sessions.delete(id);
    if (activeSessionId === id) setActiveSessionId(null);
    await refresh();
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        worktrees={worktrees} sessions={sessions}
        activeId={activeSessionId}
        onSelect={id => {
          const s = sessions.find(s => s.worktreeId === id);
          if (s) setActiveSessionId(s.id);
          setActiveWtId(id);
        }}
        onCreateWt={() => setShowModal(true)}
        onOpenCreateWt={() => setShowModal(true)}
        onNewSession={handleNewSession}
        onStart={handleStart} onStop={handleStop}
        onDeleteWt={handleDeleteWt} onDeleteSession={handleDeleteSession}
      />

      <div className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Chat
          session={activeSession || null}
          onSend={handleSend}
          onStop={() => activeSessionId && handleStop(activeSessionId)}
        />
        <TerminalPanel session={activeSession || null} />
      </div>

      <DiffPanel worktree={activeWt} />

      {/* New Worktree Modal */}
      {showModal && (
        <Modal title="建立任務樹" onClose={() => setShowModal(false)}>
          <div className="field">
            <label>名稱</label>
            <input value={wtName} onChange={e => setWtName(e.target.value)} placeholder="新功能開發" autoFocus />
          </div>
          <div className="field">
            <label>Git 倉庫路徑</label>
            <input value={wtPath} onChange={e => setWtPath(e.target.value)} placeholder="~/projects/my-repo" />
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowModal(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleCreateWt}>建立</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;
