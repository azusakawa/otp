export type ThemePref = 'light' | 'dark' | 'system';

const KEY = 'otp.theme';

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {}
  return 'system';
}

export function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(pref: ThemePref) {
  const resolved = resolveTheme(pref);
  document.documentElement.classList.toggle('light', resolved === 'light');
}

export function setThemePref(pref: ThemePref) {
  try { localStorage.setItem(KEY, pref); } catch {}
  applyTheme(pref);
}

export function initTheme() {
  applyTheme(getThemePref());
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => { if (getThemePref() === 'system') applyTheme('system'); };
  mq.addEventListener('change', handler);
}