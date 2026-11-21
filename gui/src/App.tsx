import { useState, useEffect, useRef } from 'react';
import { useT, type Lang } from './i18n';

interface Worktree {
  id: string; name: string; path: string; branch: string;
  mainBranch: string; createdAt: number; sessionIds: string[];
}

interface Message {
  id: string; role: 'user' | 'assistant' | 'system';
  content: string; timestamp: number;
}

interface Session {
  id: string; worktreeId?: string; agentType: 'opencode' | 'hermes';
  status: 'idle' | 'running' | 'error'; messages: Message[];
  pid?: number; cwd?: string; agentSessionId?: string;
  createdAt: number; updatedAt: number;
}

interface StreamState {
  agent: string;
  error: string;
}

declare global {
  interface Window {
    otp: {
      worktrees: {
        list(): Promise<Worktree[]>;
        create(n: string, p: string): Promise<Worktree | { error: string }>;
        delete(id: string): Promise<boolean>;
      };
      sessions: {
        list(): Promise<Session[]>;
        create(wtId: string | null, agent: 'opencode' | 'hermes'): Promise<Session>;
        run(id: string, prompt: string): Promise<{ pid?: number; error?: string }>;
        stop(id: string): Promise<{ ok: boolean }>;
        get(id: string): Promise<Session | undefined>;
        delete(id: string): Promise<boolean>;
      };
      scratch: {
        clear(): Promise<{ cleared: number }>;
      };
      onAgentOutput: (cb: (d: any) => void) => void;
      onSessionUpdated: (cb: (s: Session) => void) => void;
    };
  }
}

const AGENT_INFO: Record<string, { name: string; icon: string; color: string }> = {
  opencode: { name: 'OpenCode', icon: '🔵', color: '#3b82f6' },
  hermes:   { name: 'Hermes',   icon: '🟣', color: '#8b5cf6' },
};

type TFunc = (key: string, options?: Record<string, unknown>) => string;

function statusLabel(t: TFunc, status: 'idle' | 'running' | 'error'): string {
  return status === 'running' ? t('status.running') : status === 'error' ? t('status.error') : t('status.idle');
}

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

/* ── Session card (shared by quick + worktree sessions) ─────────────────── */
function SessionCard({ s, active, t, onSelect, onNewSession, onStop, onDelete }: {
  s: Session; active: boolean; t: TFunc;
  onSelect: (id: string) => void;
  onNewSession: (wtId: string | null, agent: 'opencode' | 'hermes') => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const ai = AGENT_INFO[s.agentType];
  return (
    <div className={`card ${active ? 'active' : ''}`} onClick={() => onSelect(s.id)}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontWeight: 600, fontSize: 12 }}>{ai.icon} {ai.name}</span>
        <span className={`badge badge-${s.status}`}>
          {statusLabel(t, s.status)}
        </span>
      </div>
      <div className="card-meta">{t('sidebar.messagesCount', { count: s.messages.length })}</div>
      <div className="card-actions">
        {s.status === 'running' && (
          <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); onStop(s.id); }}>{t('session.stop')}</button>
        )}
        <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onNewSession(s.worktreeId ?? null, s.agentType); }}>{t('session.duplicate')}</button>
        <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); onDelete(s.id); }}>✕</button>
      </div>
    </div>
  );
}

/* ── Sidebar ────────────────────────────────────────────────────────────── */
function Sidebar({
  worktrees, sessions, activeId, onSelect, onOpenCreateWt, onNewSession,
  onStop, onDeleteWt, onDeleteSession, onClearScratch,
}: {
  worktrees: Worktree[]; sessions: Session[]; activeId: string | null;
  onSelect: (id: string) => void; onOpenCreateWt: () => void;
  onNewSession: (wtId: string | null, agent: 'opencode' | 'hermes') => void;
  onStop: (id: string) => void;
  onDeleteWt: (id: string) => void; onDeleteSession: (id: string) => void;
  onClearScratch: () => void;
}) {
  const { t, lng, setLang } = useT();
  const treeSessions = sessions.filter(s => s.worktreeId);
  const quickSessions = sessions.filter(s => !s.worktreeId);
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>🐙 OTP</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select
            className="lang-select"
            value={lng}
            onChange={e => setLang(e.target.value as Lang)}
            title="Language / 語言"
          >
            <option value="en">EN</option>
            <option value="zh-TW">繁中</option>
          </select>
          <button className="btn btn-sm" onClick={onOpenCreateWt}>{t('sidebar.newTaskTree')}</button>
        </div>
      </div>

      <div className="sidebar-section">{t('sidebar.taskTrees', { count: worktrees.length })}</div>
      <div className="sidebar-content">
        {worktrees.length === 0 && <div style={{ padding: '12px 0', fontSize: 12, color: '#8b949e' }}>{t('sidebar.noTaskTrees')}</div>}
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

        <div className="sidebar-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{t('sidebar.ideas', { count: quickSessions.length })}</span>
          <span style={{ display: 'inline-flex', gap: 4 }}>
            <button className="btn btn-sm" title={t('sidebar.newIdea')} onClick={() => onNewSession(null, 'opencode')}>🔵</button>
            <button className="btn btn-sm" title={t('sidebar.newIdea')} onClick={() => onNewSession(null, 'hermes')}>🟣</button>
            <button className="btn btn-sm" title={t('sidebar.clearScratch')} onClick={onClearScratch}>🧹</button>
          </span>
        </div>
        {quickSessions.length === 0 && <div style={{ padding: '8px 0', fontSize: 12, color: '#8b949e' }}>{t('sidebar.noIdeas')}</div>}
        {quickSessions.map(s => (
          <SessionCard key={s.id} s={s} active={activeId === s.id} t={t} onSelect={onSelect} onNewSession={onNewSession} onStop={onStop} onDelete={onDeleteSession} />
        ))}

        <div className="sidebar-section">{t('sidebar.sessions', { count: treeSessions.length })}</div>
        {treeSessions.length === 0 && <div style={{ padding: '8px 0', fontSize: 12, color: '#8b949e' }}>{t('sidebar.noSessions')}</div>}
        {treeSessions.map(s => (
          <SessionCard key={s.id} s={s} active={activeId === s.id} t={t} onSelect={onSelect} onNewSession={onNewSession} onStop={onStop} onDelete={onDeleteSession} />
        ))}
      </div>
    </div>
  );
}

/* ── Chat ───────────────────────────────────────────────────────────────── */
function Chat({ session, stream, onSend, onStop }: {
  session: Session | null;
  stream?: StreamState;
  onSend: (msg: string) => void;
  onStop: () => void;
}) {
  const { t } = useT();
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  const displayMessages: Message[] = (() => {
    if (!session) return [];
    const msgs = [...session.messages];
    if (session.status === 'running' && stream) {
      if (stream.agent || !stream.error) {
        msgs.push({ id: '__streaming', role: 'assistant', content: stream.agent, timestamp: Date.now() });
      }
      if (stream.error) {
        msgs.push({ id: '__stream_error', role: 'system', content: stream.error, timestamp: Date.now() });
      }
    }
    return msgs;
  })();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [session?.id, session?.messages.length, stream?.agent, stream?.error]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || session?.status === 'running') return;
    onSend(input.trim());
    setInput('');
  };

  if (!session) {
    return (
      <div className="empty">
        <div className="empty-icon">🐙</div>
        <div className="empty-text">{t('chat.welcome')}</div>
        <div className="empty-hint">{t('chat.welcomeHint')}</div>
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
          {statusLabel(t, session.status)}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8b949e' }}>
          PID: {session.pid ?? '—'}
        </span>
        {session.status === 'running' && (
          <button className="btn btn-danger btn-sm" onClick={onStop}>{t('chat.stop')}</button>
        )}
      </div>

      {/* Messages */}
      <div className="chat" ref={chatRef}>
        {displayMessages.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#8b949e', fontSize: 13 }}>
            {t('chat.noMessages')}
          </div>
        )}
        {displayMessages.map((m) => (
          <div className={`msg msg-${m.role}`} key={m.id}>
            <div className="msg-role">{t(`role.${m.role}`)}</div>
            <div className="msg-bubble">{m.content}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="chat-input">
        <form className="chat-input-wrap" onSubmit={submit}>
          <textarea
            placeholder={session.status === 'running' ? t('chat.inputRunning') : t('chat.inputIdle')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e); } }}
            rows={2}
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim() || session.status === 'running'}>{t('chat.send')}</button>
        </form>
      </div>
    </div>
  );
}

/* ── Diff Panel ─────────────────────────────────────────────────────────── */
function DiffPanel({ worktree }: { worktree: Worktree | undefined }) {
  const { t } = useT();
  const [diffs, setDiffs] = useState<any[]>([]);

  useEffect(() => {
    // In a real implementation this would call git diff via IPC
    // For now, placeholder
    setDiffs([]);
  }, [worktree]);

  if (!worktree) return null;

  return (
    <div className="diff-panel">
      <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>{t('diff.title', { name: worktree.name })}</div>
      {diffs.length === 0 && <div style={{ color: '#8b949e', fontSize: 12 }}>{t('diff.none')}</div>}
      {diffs.map((d: any, i: number) => (
        <div className="diff-file" key={i}>
          <div className="diff-file-name">{d.file}</div>
          <div className="diff-hunk">
            {d.hunks?.map((h: any, j: number) => (
              <div key={j}>
                {h.adds?.map((a: string, k: number) => <div className="diff-add" key={`${j}-a-${k}`}>+ {a}</div>)}
                {h.deletes?.map((dl: string, k: number) => <div className="diff-del" key={`${j}-d-${k}`}>- {dl}</div>)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Terminal ───────────────────────────────────────────────────────────── */
function TerminalPanel({ session, stream }: { session: Session | null; stream?: StreamState }) {
  const { t } = useT();
  const termRef = useRef<HTMLDivElement>(null);

  const text = (stream?.agent ?? '') + (stream?.error ?? '');

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [text]);

  const showRaw = session?.status === 'running';

  return (
    <div className="terminal">
      <div className="terminal-header">{t('terminal.title')}</div>
      <div
        ref={termRef}
        style={{
          padding: '8px 12px',
          fontFamily: 'monospace',
          fontSize: 12,
          overflow: 'auto',
          height: '100%',
          color: '#c9d1d9',
          whiteSpace: 'pre-wrap',
        }}
      >
        {showRaw ? (
          text ? text : <div style={{ color: '#8b949e' }}>{t('terminal.rawLog')}</div>
        ) : (
          <div style={{ color: '#8b949e' }}>{t('terminal.hint')}</div>
        )}
      </div>
    </div>
  );
}

/* ── App ────────────────────────────────────────────────────────────────── */
function App() {
  const { t } = useT();
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeWtId, setActiveWtId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [wtName, setWtName] = useState('');
  const [wtPath, setWtPath] = useState('');
  const [wtError, setWtError] = useState('');
  const [streams, setStreams] = useState<Record<string, StreamState>>({});

  const activeWt = worktrees.find(w => w.id === activeWtId);
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const activeStream = activeSessionId ? streams[activeSessionId] : undefined;

  // Initial load
  useEffect(() => {
    refresh();
  }, []);

  // Listen for agent output and session updates
  useEffect(() => {
    window.otp.onAgentOutput((data) => {
      setStreams(prev => {
        const cur = prev[data.session] ?? { agent: '', error: '' };
        return {
          ...prev,
          [data.session]: {
            agent: cur.agent + (data.label === 'agent' ? data.text : ''),
            error: cur.error + (data.label === 'error' ? data.text : ''),
          },
        };
      });
    });
    window.otp.onSessionUpdated((s2) => {
      setSessions(prev => prev.map(s => (s.id === s2.id ? s2 : s)));
      setStreams(prev => {
        const n = { ...prev };
        delete n[s2.id];
        return n;
      });
    });
  }, []);

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
    setWtError('');
    const wt = await window.otp.worktrees.create(wtName.trim(), wtPath.trim());
    if (wt && typeof wt === 'object' && 'error' in wt && wt.error) {
      setWtError(wt.error);
      return;
    }
    setWtName('');
    setWtPath('');
    setWtError('');
    setShowModal(false);
    await refresh();
  };

  const handleDeleteWt = async (id: string) => {
    await window.otp.worktrees.delete(id);
    await refresh();
  };

  const handleNewSession = async (wtId: string | null, agent: 'opencode' | 'hermes') => {
    const s = await window.otp.sessions.create(wtId, agent);
    await refresh();
    setActiveSessionId(s.id);
    setActiveWtId(wtId); // null for quick sessions (clears any stale worktree)
  };

  const handleClearScratch = async () => {
    if (!window.confirm(t('sidebar.clearScratchConfirm'))) return;
    await window.otp.scratch.clear();
  };

  const handleStop = async (id: string) => {
    await window.otp.sessions.stop(id);
  };

  const handleSend = async (msg: string) => {
    if (!activeSessionId) return;
    const r = await window.otp.sessions.run(activeSessionId, msg);
    if (r?.error) {
      setStreams(prev => ({
        ...prev,
        [activeSessionId]: {
          agent: prev[activeSessionId]?.agent ?? '',
          error: (prev[activeSessionId]?.error ?? '') + t('chat.runError', { error: r.error }),
        },
      }));
    }
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
        onSelect={(id) => {
          const s = sessions.find(x => x.id === id);
          if (s) {
            setActiveSessionId(id);
            setActiveWtId(s.worktreeId ?? null);
            return;
          }
          if (worktrees.some(w => w.id === id)) setActiveWtId(id);
        }}
        onOpenCreateWt={() => { setWtError(''); setShowModal(true); }}
        onNewSession={handleNewSession}
        onStop={handleStop}
        onDeleteWt={handleDeleteWt} onDeleteSession={handleDeleteSession}
        onClearScratch={handleClearScratch}
      />

      <div className="main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Chat
          session={activeSession || null}
          stream={activeStream}
          onSend={handleSend}
          onStop={() => activeSessionId && handleStop(activeSessionId)}
        />
        <TerminalPanel session={activeSession || null} stream={activeStream} />
      </div>

      <DiffPanel worktree={activeWt} />

      {/* New Worktree Modal */}
      {showModal && (
        <Modal title={t('modal.createTaskTree')} onClose={() => { setShowModal(false); setWtError(''); }}>
          <div className="field">
            <label>{t('modal.name')}</label>
            <input value={wtName} onChange={e => setWtName(e.target.value)} placeholder={t('modal.namePlaceholder')} autoFocus />
          </div>
          <div className="field">
            <label>{t('modal.gitPath')}</label>
            <input value={wtPath} onChange={e => setWtPath(e.target.value)} placeholder="~/projects/my-repo" />
          </div>
          {wtError && <div style={{ color: '#f85149', fontSize: 12, marginTop: 8 }}>{wtError}</div>}
          <div className="modal-actions">
            <button className="btn" onClick={() => { setShowModal(false); setWtError(''); }}>{t('modal.cancel')}</button>
            <button className="btn btn-primary" onClick={handleCreateWt}>{t('modal.create')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;
