import { useState, useEffect, useRef, useCallback } from 'react';
import { useT, type Lang } from './i18n';

interface Worktree { id: string; name: string; path: string; branch: string; mainBranch: string; createdAt: number; sessionIds: string[]; }
interface Message { id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: number; }
interface Session { id: string; worktreeId?: string; agentType: 'opencode' | 'hermes'; status: 'idle' | 'running' | 'error'; messages: Message[]; pid?: number; cwd?: string; agentSessionId?: string; createdAt: number; updatedAt: number; }
interface StreamState { agent: string; error: string; }

declare global {
  interface Window {
    otp: {
      worktrees: { list(): Promise<Worktree[]>; create(n: string, p: string): Promise<Worktree | { error: string }>; delete(id: string): Promise<boolean>; };
      sessions: { list(): Promise<Session[]>; create(wtId: string | null, agent: 'opencode' | 'hermes'): Promise<Session>; run(id: string, prompt: string): Promise<{ pid?: number; error?: string }>; stop(id: string): Promise<{ ok: boolean }>; get(id: string): Promise<Session | undefined>; delete(id: string): Promise<boolean>; };
      scratch: { clear(): Promise<{ cleared: number }>; };
      onAgentOutput: (cb: (d: any) => void) => void;
      onSessionUpdated: (cb: (s: Session) => void) => void;
    };
  }
}

const AGENT_INFO: Record<string, { name: string; mark: string; color: string }> = {
  opencode: { name: 'OpenCode', mark: 'O', color: '#3b82f6' },
  hermes:   { name: 'Hermes',   mark: 'H', color: '#8b5cf6' },
};

type TFunc = (key: string, options?: Record<string, unknown>) => string;
function statusLabel(t: TFunc, status: 'idle' | 'running' | 'error'): string {
  return status === 'running' ? t('status.running') : status === 'error' ? t('status.error') : t('status.idle');
}

function useStoredSize(key: string, def: number, min: number, max: number) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); if (s) { const n = Number(s); if (!isNaN(n)) return Math.min(max, Math.max(min, n)); } } catch {}
    return def;
  });
  useEffect(() => { try { localStorage.setItem(key, String(v)); } catch {} }, [key, v]);
  return [v, setV] as const;
}

function I({ name, size = 16, stroke = 1.75 }: { name: string; size?: number; stroke?: number }) {
  const paths: Record<string, string> = {
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
    'git-compare': '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    'trash-2': '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    'git-branch': '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    paperclip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
    'alert-triangle': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    square: '<rect x="3" y="3" width="18" height="18" rx="2"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  };
  const d = paths[name] || '';
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />;
}

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

function SessionCard({ s, active, t, onSelect, onNewSession, onStop, onDelete }: any) {
  const ai = AGENT_INFO[s.agentType];
  return (
    <div className={`card ${active ? 'active' : ''}`} onClick={() => onSelect(s.id)} style={{ position:'relative', paddingLeft:12 }}>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:2, background: s.status==='running'?'var(--accent)': s.status==='error'?'var(--danger)':'var(--text-tertiary)' }} />
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
        <span style={{ fontWeight:600, fontSize:12, display:'flex', alignItems:'center', gap:6 }}>
          <span className="agent-mark" style={{ background: ai.color, width:16, height:16, fontSize:9 }}>{ai.mark}</span>
          {ai.name}
        </span>
        <span className={`status-pill ${s.status}`}><span className={`dot ${s.status}`} />{statusLabel(t, s.status)}</span>
      </div>
      <div style={{ fontSize:12, color:'var(--text-tertiary)' }}>{t('sidebar.messagesCount', { count: s.messages.length })}</div>
      <div style={{ display:'flex', gap:4, marginTop:6 }}>
        {s.status === 'running' && <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); onStop(s.id); }}>{t('session.stop')}</button>}
        <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onNewSession(s.worktreeId ?? null, s.agentType); }}>{t('session.duplicate')}</button>
        <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); onDelete(s.id); }}><I name="x" size={12} /></button>
      </div>
    </div>
  );
}

function Sidebar({ worktrees, sessions, activeId, onSelect, onOpenCreateWt, onNewSession, onStop, onDeleteWt, onDeleteSession, onClearScratch, sidebarW }: any) {
  const { t, lng, setLang } = useT();
  const [wtOpen, setWtOpen] = useState(true);
  const [sessOpen, setSessOpen] = useState(true);
  const treeSessions = sessions.filter((s: Session) => s.worktreeId);
  const quickSessions = sessions.filter((s: Session) => !s.worktreeId);
  return (
    <div className="sidebar" style={{ width: sidebarW }}>
      <div className="sidebar-header">
        <h1>OTP</h1>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <select className="lang-select" value={lng} onChange={e => setLang(e.target.value as Lang)} title="Language">
            <option value="en">EN</option><option value="zh-TW">繁中</option>
          </select>
          <button className="btn btn-sm" onClick={onOpenCreateWt}>{t('sidebar.newTaskTree')}</button>
        </div>
      </div>
      <div className="sidebar-scroll">
        <div className={`section ${wtOpen ? '' : 'collapsed'}`}>
          <div className="section-header" onClick={() => setWtOpen(o => !o)}>
            <span className="section-title"><I name="chevron-down" size={14} /><span>{t('sidebar.taskTrees', { count: worktrees.length })}</span></span>
          </div>
          <div className="section-body">
            {worktrees.length === 0 && (
              <div className="suggest-list">
                <div className="suggest">{t('sidebar.noWorktrees')}</div>
                <div className="suggest">{t('sidebar.suggestions.reviewPR')}</div>
                <div className="suggest">{t('sidebar.suggestions.fixBug')}</div>
                <div className="suggest">{t('sidebar.suggestions.explainCode')}</div>
              </div>
            )}
            {worktrees.map((wt: Worktree) => (
              <div className="wt-card" key={wt.id} onClick={() => onSelect(wt.id)}>
                <div className="status-bar-left" />
                <div className="wt-head">
                  <span className="agent-mark oc">O</span>
                  <span className="wt-name">{wt.name}</span>
                </div>
                <div className="wt-branch"><I name="git-branch" size={12} /> {wt.branch}</div>
                <div className="wt-path">{wt.path}</div>
                <div className="wt-meta">
                  <span>{wt.sessionIds.length} sessions</span>
                  <span style={{ marginLeft:'auto', display:'flex', gap:4 }}>
                    <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onNewSession(wt.id, 'opencode'); }}><span className="agent-mark oc" style={{ width:14, height:14, fontSize:8 }}>O</span></button>
                    <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onNewSession(wt.id, 'hermes'); }}><span className="agent-mark hermes" style={{ width:14, height:14, fontSize:8 }}>H</span></button>
                    <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); onDeleteWt(wt.id); }}><I name="x" size={12} /></button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`section ${sessOpen ? '' : 'collapsed'}`}>
          <div className="section-header" onClick={() => setSessOpen(o => !o)}>
            <span className="section-title"><I name="chevron-down" size={14} /><span>{t('sidebar.ideas', { count: quickSessions.length })}</span></span>
          </div>
          <div className="section-body">
            {quickSessions.length === 0 && <div style={{ padding:'8px 0', fontSize:12, color:'var(--text-tertiary)' }}>{t('sidebar.noIdeas')}</div>}
            {quickSessions.map((s: Session) => (
              <SessionCard key={s.id} s={s} active={activeId === s.id} t={t} onSelect={onSelect} onNewSession={onNewSession} onStop={onStop} onDelete={onDeleteSession} />
            ))}
            <div style={{ height:8 }} />
            <div className="section-header" style={{ height:24 }}><span className="section-title">{t('sidebar.sessions', { count: treeSessions.length })}</span></div>
            {treeSessions.length === 0 && <div style={{ padding:'8px 0', fontSize:12, color:'var(--text-tertiary)' }}>{t('sidebar.noSessions')}</div>}
            {treeSessions.map((s: Session) => (
              <SessionCard key={s.id} s={s} active={activeId === s.id} t={t} onSelect={onSelect} onNewSession={onNewSession} onStop={onStop} onDelete={onDeleteSession} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Chat({ session, stream, onSend, onStop }: any) {
  const { t } = useT();
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const displayMessages: Message[] = (() => {
    if (!session) return [];
    const msgs = [...session.messages];
    if (session.status === 'running' && stream) {
      if (stream.agent || !stream.error) msgs.push({ id:'__streaming', role:'assistant', content: stream.agent, timestamp: Date.now() });
      if (stream.error) msgs.push({ id:'__stream_error', role:'system', content: stream.error, timestamp: Date.now() });
    }
    return msgs;
  })();
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [session?.id, session?.messages.length, stream?.agent, stream?.error]);
  const submit = (e: any) => { e.preventDefault(); if (!input.trim() || session?.status === 'running') return; onSend(input.trim()); setInput(''); };
  if (!session) {
    return (
      <div className="empty">
        <I name="sparkles" size={40} />
        <h2>{t('chat.empty.greeting')}</h2>
        <p>{t('chat.empty.hint')}</p>
        <div className="prompt-cards">
          <div className="prompt-card"><div className="pc-title">{t('chat.empty.prompt.reviewPR')}</div><div className="pc-desc">{t('chat.empty.prompt.reviewPRDesc')}</div></div>
          <div className="prompt-card"><div className="pc-title">{t('chat.empty.prompt.fixBug')}</div><div className="pc-desc">{t('chat.empty.prompt.fixBugDesc')}</div></div>
          <div className="prompt-card"><div className="pc-title">{t('chat.empty.prompt.explainCode')}</div><div className="pc-desc">{t('chat.empty.prompt.explainCodeDesc')}</div></div>
        </div>
      </div>
    );
  }
  const ai = AGENT_INFO[session.agentType];
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div className="toolbar" style={{ height:40, display:'flex', alignItems:'center', gap:8, padding:'0 16px', borderBottom:'1px solid var(--border-subtle)', background:'var(--bg-surface)' }}>
        <span className="agent-mark" style={{ background: ai.color }}>{ai.mark}</span>
        <span style={{ fontWeight:600 }}>{ai.name}</span>
        <span className={`status-pill ${session.status}`} style={{ marginLeft:8 }}><span className={`dot ${session.status}`} />{statusLabel(t, session.status)}</span>
        <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text-tertiary)' }}>PID: {session.pid ?? '—'}</span>
        {session.status === 'running' && <button className="btn btn-danger btn-sm" onClick={onStop}>{t('chat.stop')}</button>}
      </div>
      <div className="chat" ref={chatRef}>
        <div className="chat-inner">
          {displayMessages.length === 0 && <div style={{ padding:'32px 0', textAlign:'center', color:'var(--text-tertiary)', fontSize:13 }}>{t('chat.noMessages')}</div>}
          {displayMessages.map((m) => (
            <div className={`msg msg-${m.role}`} key={m.id}>
              <div className="msg-role">{t(`role.${m.role}`)}</div>
              <div className="msg-bubble">{m.content}</div>
              <div className="msg-meta">{new Date(m.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="composer-area">
        <div className="composer-mask" />
        <div className="composer">
          <textarea placeholder={session.status === 'running' ? t('chat.inputRunning') : t('chat.inputIdle')} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e); } }} rows={1} />
          <div className="composer-row">
            <div className="composer-tools">
              <button className="icon-btn" title="attach"><I name="paperclip" size={16} /></button>
              <button className="icon-btn" title="model"><I name="settings" size={16} /></button>
              <span className="kbd">⌘↵ {t('chat.send')}</span>
            </div>
            <button className="send-btn" disabled={!input.trim() || session.status === 'running'} onClick={submit}><I name="send" size={14} /> {t('chat.send')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TerminalPanel({ session, stream, termH }: any) {
  const { t } = useT();
  const termRef = useRef<HTMLDivElement>(null);
  const text = (stream?.agent ?? '') + (stream?.error ?? '');
  useEffect(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight; }, [text]);
  const showRaw = session?.status === 'running';
  return (
    <div className="terminal-dock" style={{ height: termH }}>
      <div className="terminal-tabs">
        <div className="term-tab active"><I name="terminal" size={12} /> bash</div>
        <div className="term-tab">node</div>
        <button className="icon-btn" style={{ marginLeft:'auto', width:24, height:24 }} title="new"><I name="plus" size={14} /></button>
      </div>
      {showRaw && text ? (
        <div className="terminal-body" ref={termRef}>{text}</div>
      ) : showRaw && !text ? (
        <div className="terminal-body" ref={termRef} style={{ color:'var(--text-tertiary)' }}>{t('terminal.rawLog')}</div>
      ) : (
        <div className="term-empty">
          <I name="terminal" size={32} />
          <h3>{t('terminal.empty.title')}</h3>
          <p>{t('terminal.empty.hint')}</p>
          <button className="cta"><I name="plus" size={12} /> {t('terminal.empty.cta')} · ⌘J</button>
        </div>
      )}
    </div>
  );
}

function DiffPanel({ worktree }: any) {
  const { t } = useT();
  if (!worktree) return (
    <div className="diff-dock">
      <div className="diff-toolbar"><span className="title">{t('diff.title', { name: '—' })}</span></div>
      <div className="diff-empty">
        <I name="git-compare" size={32} />
        <h3>{t('diff.empty.title')}</h3>
        <p>{t('diff.empty.hint')}</p>
      </div>
    </div>
  );
  return (
    <div className="diff-dock">
      <div className="diff-toolbar">
        <span className="title">{t('diff.title', { name: worktree.name })}</span>
        <button className="icon-btn" style={{ width:24, height:24 }} title="refresh"><I name="refresh" size={14} /></button>
      </div>
      <div className="diff-body">
        <div style={{ color:'var(--text-tertiary)', fontSize:12 }}>{t('diff.none')}</div>
      </div>
    </div>
  );
}

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
  const [railTab, setRailTab] = useState('worktrees');

  const [sidebarW, setSidebarW] = useStoredSize('otp.sidebarW', 272, 220, 400);
  const [termH, setTermH] = useStoredSize('otp.termH', 200, 140, 360);

  const activeWt = worktrees.find(w => w.id === activeWtId);
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const activeStream = activeSessionId ? streams[activeSessionId] : undefined;

  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    window.otp.onAgentOutput((data) => {
      setStreams(prev => {
        const cur = prev[data.session] ?? { agent: '', error: '' };
        return { ...prev, [data.session]: { agent: cur.agent + (data.label === 'agent' ? data.text : ''), error: cur.error + (data.label === 'error' ? data.text : '') } };
      });
    });
    window.otp.onSessionUpdated((s2) => {
      setSessions(prev => prev.map(s => (s.id === s2.id ? s2 : s)));
      setStreams(prev => { const n = { ...prev }; delete n[s2.id]; return n; });
    });
  }, []);

  const refresh = async () => {
    const [wt, ss] = await Promise.all([window.otp.worktrees.list(), window.otp.sessions.list()]);
    setWorktrees(wt); setSessions(ss);
  };
  const handleCreateWt = async () => {
    if (!wtName.trim() || !wtPath.trim()) return;
    setWtError('');
    const wt = await window.otp.worktrees.create(wtName.trim(), wtPath.trim());
    if (wt && typeof wt === 'object' && 'error' in wt && wt.error) { setWtError(wt.error); return; }
    setWtName(''); setWtPath(''); setWtError(''); setShowModal(false); await refresh();
  };
  const handleDeleteWt = async (id: string) => { await window.otp.worktrees.delete(id); await refresh(); };
  const handleNewSession = async (wtId: string | null, agent: 'opencode' | 'hermes') => {
    const s = await window.otp.sessions.create(wtId, agent); await refresh(); setActiveSessionId(s.id); setActiveWtId(wtId);
  };
  const handleClearScratch = async () => { if (!window.confirm(t('sidebar.clearScratchConfirm'))) return; await window.otp.scratch.clear(); };
  const handleStop = async (id: string) => { await window.otp.sessions.stop(id); };
  const handleSend = async (msg: string) => {
    if (!activeSessionId) return;
    const r = await window.otp.sessions.run(activeSessionId, msg);
    if (r?.error) setStreams(prev => ({ ...prev, [activeSessionId]: { agent: prev[activeSessionId]?.agent ?? '', error: (prev[activeSessionId]?.error ?? '') + t('chat.runError', { error: r.error }) } }));
  };
  const handleDeleteSession = async (id: string) => { await window.otp.sessions.delete(id); if (activeSessionId === id) setActiveSessionId(null); await refresh(); };

  // resizable handlers
  const onSidebarDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX; const startW = sidebarW;
    const move = (ev: MouseEvent) => setSidebarW(Math.min(400, Math.max(220, startW + (ev.clientX - startX))));
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  }, [sidebarW, setSidebarW]);
  const onTermDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY; const startH = termH;
    const move = (ev: MouseEvent) => setTermH(Math.min(360, Math.max(140, startH - (ev.clientY - startY))));
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  }, [termH, setTermH]);

  const railItems = [
    { id:'worktrees', icon:'folder', label: t('rail.worktrees') },
    { id:'sessions', icon:'message-square', label: t('rail.sessions') },
    { id:'terminal', icon:'terminal', label: t('rail.terminal') },
    { id:'diff', icon:'git-compare', label: t('rail.diff') },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh' }}>
      {/* Title bar */}
      <div style={{ height:36, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 12px', background:'var(--bg-surface)', borderBottom:'1px solid var(--border-subtle)', userSelect:'none' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontWeight:600, fontSize:13 }}>
          <I name="sparkles" size={16} /> OTP
        </div>
        <div style={{ fontSize:12, color:'var(--text-secondary)', fontWeight:500 }}>{activeWt ? `${activeWt.name} · ${activeWt.branch}` : '—'}</div>
        <div style={{ display:'flex', gap:4 }}>
          {['minus','square','x'].map(k => <div key={k} style={{ width:32, height:24, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:4, color:'var(--text-secondary)', cursor:'pointer' }}><I name={k === 'minus' ? 'square' : k === 'square' ? 'square' : 'x'} size={14} /></div>)}
        </div>
      </div>
      <div style={{ display:'flex', flex:1, minHeight:0 }}>
        {/* Rail */}
        <div className="rail">
          {railItems.map(it => (
            <div key={it.id} className={`rail-item ${railTab === it.id ? 'active' : ''}`} title={it.label} onClick={() => setRailTab(it.id)}><I name={it.icon} size={24} stroke={1.5} /></div>
          ))}
          <div className="rail-spacer" />
          <div className="rail-item" title={t('rail.settings')}><I name="settings" size={24} stroke={1.5} /></div>
        </div>
        {/* Sidebar */}
        <Sidebar worktrees={worktrees} sessions={sessions} activeId={activeSessionId} onSelect={(id: string) => {
          const s = sessions.find((x: Session) => x.id === id);
          if (s) { setActiveSessionId(id); setActiveWtId(s.worktreeId ?? null); return; }
          if (worktrees.some((w: Worktree) => w.id === id)) setActiveWtId(id);
        }} onOpenCreateWt={() => { setWtError(''); setShowModal(true); }} onNewSession={handleNewSession} onStop={handleStop} onDeleteWt={handleDeleteWt} onDeleteSession={handleDeleteSession} onClearScratch={handleClearScratch} sidebarW={sidebarW} />
        {/* divider */}
        <div className="divider" onMouseDown={onSidebarDrag} onDoubleClick={() => setSidebarW(272)} />
        {/* Main */}
        <div className="main" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <Chat session={activeSession || null} stream={activeStream} onSend={handleSend} onStop={() => activeSessionId && handleStop(activeSessionId)} />
          <div className="divider-h" onMouseDown={onTermDrag} onDoubleClick={() => setTermH(200)} />
          <TerminalPanel session={activeSession || null} stream={activeStream} termH={termH} />
        </div>
        {/* Diff */}
        <DiffPanel worktree={activeWt} />
      </div>
      {/* Status bar */}
      <div className="statusbar">
        <div className="statusbar-left">
          <div className="statusbar-item"><span className={`dot ${activeSession?.status ?? 'idle'}`} /> {activeSession ? statusLabel(t, activeSession.status) + ' · ' + AGENT_INFO[activeSession.agentType].name : t('status.idle')}</div>
          <div className="statusbar-item"><I name="git-branch" size={12} /> {activeWt?.branch ?? '—'}</div>
          {activeSession && <div className="statusbar-item">{activeSession.messages.length} msgs</div>}
        </div>
        <div className="statusbar-right">
          <div className="statusbar-item">UTF-8</div>
          <div className="statusbar-item">⌘K {t('rail.settings')} · ⌘B · ⌘J</div>
        </div>
      </div>
      {/* Modal */}
      {showModal && (
        <Modal title={t('modal.createTaskTree')} onClose={() => { setShowModal(false); setWtError(''); }}>
          <div className="field"><label>{t('modal.name')}</label><input value={wtName} onChange={e => setWtName(e.target.value)} placeholder={t('modal.namePlaceholder')} autoFocus /></div>
          <div className="field"><label>{t('modal.gitPath')}</label><input value={wtPath} onChange={e => setWtPath(e.target.value)} placeholder="~/projects/my-repo" /></div>
          {wtError && <div style={{ color:'var(--danger)', fontSize:12, marginTop:8 }}>{wtError}</div>}
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