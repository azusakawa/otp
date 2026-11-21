# OTP GUI Redesign — 實作 Spec

> 設計產物（design phase）。**未修改任何 OTP 源碼**。所有設計語言以 `docs/design/reference-100k-stars.md`（查證 2026-11-21）為準。mockup 見 `gui/design/mockup.html`。

## 1. Design Tokens（CSS custom properties）

### Dark（`:root` / `.dark`）
| Token | 值 | 用途 |
|---|---|---|
| `--bg-canvas` | `#1a1a1c` | 最底層工作區 |
| `--bg-surface` | `#202023` | sidebar / panel |
| `--bg-elevated` | `#26262a` | popover / command palette |
| `--bg-hover` | `rgba(255,255,255,.06)` | hover 疊層 |
| `--bg-active` | `rgba(255,255,255,.10)` | active / selected |
| `--border-subtle` | `rgba(255,255,255,.08)` | 一般分隔 |
| `--border-strong` | `rgba(255,255,255,.14)` | 輸入框 / 焦點區 |
| `--text-primary` | `#e6e6e8` | 正文 |
| `--text-secondary` | `#a0a0a8` | 次要說明 |
| `--text-tertiary` | `#6f6f78` | placeholder / disabled |
| `--accent` | `#4f8cff` | 主要動作 / focus / 選中 |
| `--accent-hover` | `#6ba1ff` | hover |
| `--accent-pressed` | `#3a73e0` | pressed |
| `--success` | `#2ea043` | 成功 / 完成 |
| `--warning` | `#d29922` | 警告 / 等待 |
| `--danger` | `#f85149` | 錯誤 / 刪除 |
| `--info` | `#58a6ff` | 資訊 |
| `--focus-ring` | `rgba(79,140,255,.55)` | 2px ring |

狀態四件套（n8n）：
```css
--status-{success|warning|danger|info}-{bg|border|text|icon}
/* bg: color-mix(in oklch, var(--X) 12%, transparent) */
/* border: color-mix(in oklch, var(--X) 32%, transparent) */
```

### Light（`.light`）
`--bg-canvas #fafafa`、`--bg-surface #ffffff`、`--border-subtle rgba(0,0,0,.08)`、`--text-primary #18181b`、`--accent #2563eb`，其餘類推。**不**用 dark 反轉硬做。

### Typography
| Token | Size/Line | Weight | 用途 |
|---|---|---|---|
| `--text-display` | 24/30 | 600 | 頁面 / 空狀態主標 |
| `--text-title` | 18/24 | 600 | panel 標題、worktree 名稱 |
| `--text-subtitle` | 16/24 | 600 | section 標題 |
| `--text-body` | 14/22 | 400 | chat 訊息、diff 內容 |
| `--text-ui` | 13/18 | 400/500 | sidebar、toolbar、按鈕 |
| `--text-meta` | 12/16 | 400/500 | 時間、token 數、狀態 |
| `--text-micro` | 11/14 | 500 | badge（少量） |
| `--text-mono` | 12.5/20 | 400 | terminal、code、diff |

UI 字族：`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`。Mono：`"JetBrains Mono", "Cascadia Code", "SFMono-Regular", Consolas, monospace`。Weight 只用 400/500/600。

### Spacing / Radius / Motion
- Spacing 4px 制：2/4/6/8/12/16/20/24/32。
- `--radius: 8px`，推導 sm 6 / md 8 / lg 10 / xl 14。
- Motion：fast 120ms `cubic-bezier(.2,.8,.2,1)`；base 180ms `cubic-bezier(.22,1,.36,1)`；slow 240ms 同；exit 120ms ease-in。只用 opacity/transform。`prefers-reduced-motion: reduce` → 0ms。

## 2. Layout Grid
- Title bar 36px（可拖拽；左 OTP 標記 / 中 worktree 名稱 / 右視窗控制）。
- Activity rail 48px。
- Sidebar 272px（min 220 / max 400），localStorage 記憶寬度；雙擊 divider 重設。
- Chat 內容 max-width 760px 居中；左右 padding 24–32px；訊息間 16–20px。
- Terminal dock 200px（min 140 / max 360），tab 32px，內容 padding 12px。
- Diff dock 380px（min 300 / max 520）。
- Status bar 24px。
- Command palette：Ctrl/Cmd+K，浮動 island，寬 560px，max-height 420px。

## 3. 元件規格（結構 / 尺寸 / 狀態 / a11y）

- **Rail**：48px；icon 24px stroke 1.5；選中左 2px accent bar + surface tint；每個 item `aria-label` + tooltip + 快捷鍵。
- **Sidebar section header**：28px；可折疊（chevron 旋轉 180ms）；hover 才顯示動作（a11y 用 width:0 非 display:none）。
- **Worktree 卡片**：左側 2px 狀態條（running accent pulse / idle tertiary / error danger）；agent 標記為單色字母 geometric mark（O/H），不用 emoji；名稱 13px 600；分支 12px；路徑 11px mono；狀態 pill 四件套（bg 12% / border 32% / text 100%）。
- **Session 列**：32px；13px 標題 + 12px meta；選中 surface tint；雙擊 rename。
- **Chat 訊息**：user bubble surface + border；assistant 無 bubble（padding 2px 0）；角色標籤 11px uppercase；meta 11px tertiary；訊息間 18px；進場 opacity+translateY(4px) 180ms；streaming 時不重播。
- **Composer**：圓角 10px；border-strong；focus ring 2px accent；底部 gradient mask 24px；送出按鈕 accent； disabled opacity .5。
- **Terminal dock**：tab 32px；內容 mono 12.5/1.6；padding 12px 16px；空狀態 CTA + ⌘J。
- **Diff dock**：toolbar 32px；行 +/- 只用 12% 文字背景色（success/danger），不整行染色。
- **Status bar**：24px；12px；run 狀態/分支/模型/耗時/快捷鍵。
- **空狀態**：標題 + 一句說明 + 單一 CTA + 快捷鍵；chat 空：greeting + 3 prompt cards；terminal 空：「沒有執行中的終端」+ CTA + ⌘J；sidebar 無 session：3 個 suggestion。

## 4. Icon 清單（Lucide）
rail: folder / message-square / terminal / git-compare / settings（24px stroke 1.5）
sidebar: chevron-down（14px）、plus（12px）、trash-2（14px）、git-branch（12px）
chat: paperclip、sliders、send、sparkles、alert-triangle
status: check、play、square
尺寸：16px inline/按鈕、20px toolbar/sidebar、24px rail/空狀態；stroke 1.75（16–20）/1.5（24）；currentColor。

## 5. i18n 新增 / 修改 keys

### en
- `rail.worktrees`, `rail.sessions`, `rail.terminal`, `rail.diff`, `rail.settings`
- `sidebar.noWorktrees`, `sidebar.suggestions.reviewPR`, `sidebar.suggestions.fixBug`, `sidebar.suggestions.explainCode`
- `chat.empty.greeting`, `chat.empty.hint`, `chat.empty.prompt.reviewPR`, `chat.empty.prompt.fixBug`, `chat.empty.prompt.explainCode`
- `terminal.empty.title`, `terminal.empty.hint`, `terminal.empty.cta`
- `diff.empty.title`, `diff.empty.hint`
- `status.running`, `status.idle`, `status.error`（移除 emoji，改為純文字；狀態圖示由 CSS dot 表達）
- `session.stop`, `session.duplicate`（移除 emoji）
- `worktree.status.running/idle/error`

### zh-TW
同上對應中文（見 mockup 文案）。

### 修改（移除 emoji）
- `sidebar.ideas`: `💬 Ideas` → `構想`
- `sidebar.noIdeas`: 移除 🔵/🟣
- `chat.welcomeHint`: 移除 💬
- `diff.title`: 移除 📋
- `status.*`: 移除 ●/○/✕（改 CSS dot）

## 6. 實作映射
- `gui/index.html` `<style>`：全面替換 GitHub-dark hex 為 token；新增 rail/sidebar/statusbar/terminal/diff shell；type scale；icon 交換。
- `gui/src/App.tsx`：`AGENT_INFO` 改用單色字母 mark（移除 emoji）；新增 rail 元件；sidebar 可折疊 section；chat max-width 760 + composer gradient mask；terminal dock 200 + tabs；diff dock 380 toolbar。
- `gui/src/i18n.ts`：新增/改名 keys（見 §5）。

## 7. 實作約束
- 純 Electron `file://` 載入 dist（無 dev server、無 DevTools）。
- CSP：`script-src 'self' https://unpkg.com`（Lucide 若不採 inline SVG 須走 unpkg UMD）。
- i18n 走 CDN（unpkg）。
- `pnpm build` 後 `electron .` 驗證。
- 用戶端文字一律大寫 **OTP**；npm 套件 `@otp/*`、CLI `otp`、資料目錄 `~/.otp/`、`window.otp` 維持小寫。
- 只寫入 `gui/design/`（設計階段）；實作階段才動源碼。

## 8. 優先序
- **P0**：tokens + shell 骨架（rail/sidebar/statusbar/terminal/diff 尺寸）+ type scale + icon 交換（emoji → Lucide）。
- **P1**：motion + empty state + resizable + localStorage 記憶 + high-contrast。
- **P2**：command palette、light theme、UI scale。

## 9. 與報告建議的偏離
- 無重大偏離。微調：terminal dock 預設 200px（報告建議 200，一致）；sidebar 預設 272px（報告 272，一致）；status bar 24px（報告 24，一致）。
- mockup 使用 `color-mix(in oklch, ...)` 代替報告的 `color-mix` 建議，以便在現代瀏覽器（Chromium/Electron）直接渲染；Electron Chromium 支援 `color-mix` 與 oklch，無相容性風險。
- 報告 §4.5 建議「不要 animate width」；mockup 全部使用 opacity/transform，sidebar 收合用 transform+clip，符合。

## 10. 參考來源
同 `docs/design/reference-100k-stars.md` §7。查證日期 2026-11-21。