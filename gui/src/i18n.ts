import { useSyncExternalStore } from 'react';

/**
 * i18next is loaded from a CDN (see index.html) instead of as an npm
 * dependency, so we declare a minimal structural type for the UMD global.
 */
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

type SectionDict = Record<string, string>;

const en: Record<string, SectionDict> = {
  sidebar: {
    newTaskTree: '+ Task Tree',
    taskTrees: 'Task Trees ({{count}})',
    noTaskTrees: 'Click "+ Task Tree" to create one',
    sessions: 'Sessions ({{count}})',
    noSessions: 'Sessions appear here after a task tree is created',
    ideas: '💬 Ideas ({{count}})',
    noIdeas: 'Click 🔵/🟣 to start an idea session without a project',
    newIdea: 'New idea session (no project)',
    clearScratch: 'Clear idea workspaces (~/.otp/scratch)',
    clearScratchConfirm: 'Delete all idea workspaces under ~/.otp/scratch? Conversation records are kept. Continue?',
    messagesCount: '{{count}} messages',
  },
  status: { running: '● Running', idle: '○ Idle', error: '✕ Error' },
  session: { stop: '⏹ Stop', duplicate: '+ Duplicate' },
  chat: {
    welcome: 'Welcome to OTP',
    welcomeHint: 'Create a task tree on the left → pick an agent → start collaborating — or use 💬 Ideas for project-free sessions',
    stop: 'Stop',
    noMessages: 'No messages yet — type below to start collaborating',
    inputRunning: 'Type a message to send to the agent...',
    inputIdle: 'Start the session to send messages',
    send: 'Send →',
    runError: 'Run failed: {{error}}',
  },
  role: { user: 'user', assistant: 'assistant', system: 'system' },
  diff: { title: '📋 Changes: {{name}}', none: 'No changes yet' },
  terminal: {
    title: 'Terminal Output',
    waiting: 'Waiting for agent output...',
    hint: 'Start an agent to see output here',
    rawLog: 'Raw output',
  },
  modal: {
    createTaskTree: 'New Task Tree',
    name: 'Name',
    namePlaceholder: 'e.g. new-feature',
    gitPath: 'Git repository path',
    cancel: 'Cancel',
    create: 'Create',
  },
};

const zhTW: Record<string, SectionDict> = {
  sidebar: {
    newTaskTree: '+ 任務樹',
    taskTrees: '任務樹 ({{count}})',
    noTaskTrees: '點擊「+ 任務樹」建立',
    sessions: '工作階段 ({{count}})',
    noSessions: '建立任務樹後自動顯示',
    ideas: '💬 構想 ({{count}})',
    noIdeas: '點 🔵/🟣 開始一個不需專案的構想對話',
    newIdea: '新的構想對話（不需專案）',
    clearScratch: '清空構想工作區（~/.otp/scratch）',
    clearScratchConfirm: '刪除 ~/.otp/scratch 下所有構想工作目錄？對話記錄會保留。確定嗎？',
    messagesCount: '{{count}} 則訊息',
  },
  status: { running: '● 執行中', idle: '○ 閒置', error: '✕ 錯誤' },
  session: { stop: '⏹ 停止', duplicate: '+ 副本' },
  chat: {
    welcome: '歡迎使用 OTP',
    welcomeHint: '左側建立任務樹 → 選智能體 → 啟動開始協作；不需專案可用 💬 構想',
    stop: '停止',
    noMessages: '沒有對話，輸入訊息開始協作',
    inputRunning: '輸入訊息發送給智能體...',
    inputIdle: '啟動後可發送訊息',
    send: '發送 →',
    runError: '執行失敗：{{error}}',
  },
  role: { user: '使用者', assistant: '智能體', system: '系統' },
  diff: { title: '📋 變更 {{name}}', none: '暫無變更' },
  terminal: {
    title: '終端輸出',
    waiting: '等待智能體輸出...',
    hint: '啟動智能體後在此顯示輸出',
    rawLog: '原始輸出',
  },
  modal: {
    createTaskTree: '建立任務樹',
    name: '名稱',
    namePlaceholder: '新功能開發',
    gitPath: 'Git 倉庫路徑',
    cancel: '取消',
    create: '建立',
  },
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

/* Fallback used only when the CDN script could not be loaded (e.g. offline). */
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
  const [section, name] = key.split('.');
  const value =
    resources[fallbackLang].translation[section]?.[name] ??
    resources.en.translation[section]?.[name] ??
    key;
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

/**
 * React hook: re-renders the component when the active language changes.
 */
export function useT(): { t: typeof translate; lng: string; setLang: (lng: Lang) => void } {
  const lng = useSyncExternalStore(subscribe, getLanguage);
  return { t: translate, lng, setLang: setLanguage };
}
