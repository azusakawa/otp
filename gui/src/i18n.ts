import { useSyncExternalStore } from 'react';

export interface I18n {
  language: string;
  t(key: string, options?: Record<string, unknown>): string;
  changeLanguage(lng: string): Promise<void>;
  init(options: Record<string, unknown>): void | Promise<void>;
  on(event: string, listener: () => void): unknown;
  off(event: string, listener: () => void): unknown;
}

declare global {
  interface Window {
    i18next?: I18n;
  }
}

export const SUPPORTED_LANGS = ['en', 'zh-TW'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

const STORAGE_KEY = 'otp.lang';

interface SectionDict { [key: string]: string | SectionDict; }

const en: Record<string, SectionDict> = {
  rail: {
    worktrees: 'Worktrees',
    sessions: 'Sessions',
    terminal: 'Terminal',
    diff: 'Diff',
    settings: 'Settings',
  },
  sidebar: {
    newTaskTree: '+ Task Tree',
    taskTrees: 'Task Trees ({{count}})',
    noTaskTrees: 'Click "+ Task Tree" to create one',
    sessions: 'Sessions ({{count}})',
    noSessions: 'Sessions appear here after a task tree is created',
    ideas: 'Ideas ({{count}})',
    noIdeas: 'Click O/H to start an idea session without a project',
    newIdea: 'New idea session (no project)',
    clearScratch: 'Clear idea workspaces (~/.otp/scratch)',
    clearScratchConfirm: 'Delete all idea workspaces under ~/.otp/scratch? Conversation records are kept. Continue?',
    messagesCount: '{{count}} messages',
    noWorktrees: 'No worktrees yet. Add one with + Task Tree or press Cmd+O.',
    suggestions: {
      reviewPR: 'Review PR',
      fixBug: 'Fix bug',
      explainCode: 'Explain code',
    },
  },
  status: { running: 'Running', idle: 'Idle', error: 'Error' },
  session: { stop: 'Stop', duplicate: 'Duplicate' },
  chat: {
    welcome: 'Welcome to OTP',
    welcomeHint: 'Create a task tree on the left, pick an agent, and start collaborating — or use Ideas for project-free sessions',
    stop: 'Stop',
    noMessages: 'No messages yet — type below to start collaborating',
    inputRunning: 'Type a message to send to the agent...',
    inputIdle: 'Start the session to send messages',
    send: 'Send',
    runError: 'Run failed: {{error}}',
    empty: {
      greeting: 'Welcome to OTP',
      hint: 'Create a task tree on the left → pick an agent → start collaborating. Or start with a suggestion below.',
      prompt: {
        reviewPR: 'Review a PR',
        reviewPRDesc: 'Analyze a diff and give review comments',
        fixBug: 'Fix a bug',
        fixBugDesc: 'Locate and fix an error',
        explainCode: 'Explain code',
        explainCodeDesc: 'Understand how a module works',
      },
    },
  },
  role: { user: 'user', assistant: 'assistant', system: 'system' },
  diff: { title: 'Changes: {{name}}', none: 'No changes yet', empty: { title: 'Select a file to see changes', hint: 'Diff source: working tree or commit. Shown after a session starts.' } },
  terminal: {
    title: 'Terminal Output',
    waiting: 'Waiting for agent output...',
    hint: 'Start an agent to see output here',
    rawLog: 'Raw output',
    empty: { title: 'No terminal running', hint: 'Output appears here after an agent starts', cta: 'Open terminal' },
  },
  modal: {
    createTaskTree: 'New Task Tree',
    name: 'Name',
    namePlaceholder: 'e.g. new-feature',
    gitPath: 'Git repository path',
    cancel: 'Cancel',
    create: 'Create',
  },
  worktree: { status: { running: 'Running', idle: 'Idle', error: 'Error' } },
};

const zhTW: Record<string, SectionDict> = {
  rail: {
    worktrees: '工作樹',
    sessions: '工作階段',
    terminal: '終端',
    diff: '差異',
    settings: '設定',
  },
  sidebar: {
    newTaskTree: '+ 任務樹',
    taskTrees: '任務樹 ({{count}})',
    noTaskTrees: '點擊「+ 任務樹」建立',
    sessions: '工作階段 ({{count}})',
    noSessions: '建立任務樹後自動顯示',
    ideas: '構想 ({{count}})',
    noIdeas: '點 O/H 開始一個不需專案的構想對話',
    newIdea: '新的構想對話（不需專案）',
    clearScratch: '清空構想工作區（~/.otp/scratch）',
    clearScratchConfirm: '刪除 ~/.otp/scratch 下所有構想工作目錄？對話記錄會保留。確定嗎？',
    messagesCount: '{{count}} 則訊息',
    noWorktrees: '尚無工作樹。點「+ 任務樹」或按 Cmd+O 加入 Git 倉庫。',
    suggestions: {
      reviewPR: '審查 PR',
      fixBug: '修復 bug',
      explainCode: '解釋程式碼',
    },
  },
  status: { running: '執行中', idle: '閒置', error: '錯誤' },
  session: { stop: '停止', duplicate: '副本' },
  chat: {
    welcome: '歡迎使用 OTP',
    welcomeHint: '左側建立任務樹 → 選智能體 → 啟動開始協作；不需專案可用 構想',
    stop: '停止',
    noMessages: '沒有對話，輸入訊息開始協作',
    inputRunning: '輸入訊息發送給智能體...',
    inputIdle: '啟動後可發送訊息',
    send: '發送',
    runError: '執行失敗：{{error}}',
    empty: {
      greeting: '歡迎使用 OTP',
      hint: '左側建立工作樹 → 選擇智能體 → 啟動開始協作。或用下方建議開始。',
      prompt: {
        reviewPR: '審查 PR',
        reviewPRDesc: '分析 diff 並給出審查意見',
        fixBug: '修復 bug',
        fixBugDesc: '定位並修復一個錯誤',
        explainCode: '解釋程式碼',
        explainCodeDesc: '理解一個模組的運作',
      },
    },
  },
  role: { user: '使用者', assistant: '智能體', system: '系統' },
  diff: { title: '變更 {{name}}', none: '暫無變更', empty: { title: '選擇檔案查看變更', hint: '差異來源：working tree 或 commit。啟動工作階段後自動顯示。' } },
  terminal: {
    title: '終端輸出',
    waiting: '等待智能體輸出...',
    hint: '啟動智能體後在此顯示輸出',
    rawLog: '原始輸出',
    empty: { title: '沒有執行中的終端', hint: '啟動智能體後輸出會顯示於此', cta: '開啟終端' },
  },
  modal: {
    createTaskTree: '建立任務樹',
    name: '名稱',
    namePlaceholder: '新功能開發',
    gitPath: 'Git 倉庫路徑',
    cancel: '取消',
    create: '建立',
  },
  worktree: { status: { running: '執行中', idle: '閒置', error: '錯誤' } },
};

const resources: Record<Lang, { translation: Record<string, SectionDict> }> = {
  en: { translation: en },
  'zh-TW': { translation: zhTW },
};

function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved as Lang)) return saved as Lang;
  } catch {
    /* storage unavailable */
  }
  return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
}

const i18n: I18n | null = window.i18next ?? null;

let fallbackLang: Lang = detectInitialLang();
let fallbackListeners: Array<() => void> = [];

function interpolate(template: string, options?: Record<string, unknown>): string {
  let out = template;
  for (const [key, value] of Object.entries(options ?? {})) {
    out = out.split(`{{${key}}}`).join(String(value));
  }
  return out;
}

function fallbackT(key: string, options?: Record<string, unknown>): string {
  const parts = key.split('.');
  let value: any = resources[fallbackLang].translation;
  for (const p of parts) value = value?.[p];
  if (typeof value !== 'string') {
    value = resources.en.translation;
    for (const p of parts) value = value?.[p];
  }
  if (typeof value !== 'string') return key;
  return interpolate(value, options);
}

if (i18n) {
  i18n.init({
    lng: detectInitialLang(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources,
  });
  i18n.on('languageChanged', () => {
    document.documentElement.lang = i18n.language;
  });
  document.documentElement.lang = i18n.language;
} else {
  console.error('[OTP] i18next CDN script failed to load — using built-in dictionary fallback');
  document.documentElement.lang = fallbackLang;
}

const translate: (key: string, options?: Record<string, unknown>) => string = i18n
  ? (key, options) => i18n.t(key, options)
  : fallbackT;

export const t = translate;

export function getLanguage(): string {
  return i18n ? i18n.language : fallbackLang;
}

export function setLanguage(lng: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  if (i18n) {
    void i18n.changeLanguage(lng);
  } else {
    fallbackLang = lng;
    document.documentElement.lang = lng;
    fallbackListeners.forEach((cb) => cb());
  }
}

function subscribe(cb: () => void): () => void {
  if (i18n) {
    i18n.on('languageChanged', cb);
    return () => {
      i18n.off('languageChanged', cb);
    };
  }
  fallbackListeners.push(cb);
  return () => {
    fallbackListeners = fallbackListeners.filter((l) => l !== cb);
  };
}

export function useT(): { t: typeof translate; lng: string; setLang: (lng: Lang) => void } {
  const lng = useSyncExternalStore(subscribe, getLanguage);
  return { t: translate, lng, setLang: setLanguage };
}