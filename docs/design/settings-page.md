# OTP 設定頁 — 設計

> 2026-11-21。延伸 `reference-100k-stars.md`（同日查證）已批准的設計語言。
> 本輪查證（GitHub REST API，2026-11-21）：**VS Code 195,691★**、**n8n 211,560★**（均 100K+）。

## 1. 目的
- 新增「設定」頁：外觀（主題：淺色 / 深色 / 跟隨系統）+ 語言（English / 繁體中文）。
- 設定頁是未來所有設定的入口（extensible）：section 用資料驅動，未來加項目只加一個 section。
- 既有 i18n 的 sidebar 語言 select 移除，搬進設定頁。

## 2. 參考 pattern（查證來源）
- **VS Code（195,691★）**：activity bar 底部齒輪 → 設定視圖在 main 區域開啟（editor 區），側欄保持；設定頁為分節列表（section title + 描述 + 控制項），居中閱讀寬度。
- **n8n（211,560★）**：主題選擇用 radio card / segment（Light / Dark / System 三選，各帶 icon）；設定分節用卡片分層。
- **shadcn/ui（128,655★，引用既有報告）**：segmented control、focus ring、token 系統。
- **Dify（161,586★，引用既有報告）**：字級階梯（section title 16/600、body 14、meta 12）。

## 3. 設計決策
- **位置**：rail 底部「設定」齒輪（既有）→ 開啟設定視圖，取代 chat 欄（main 中央）；terminal dock / diff dock 保持可見；rail 該項進入 active 狀態（左 2px accent bar + tint，與其他 rail 項一致）。再點一次齒輪 → 回 chat。
- **佈局**：max-width 560px 居中，左右 padding 32px；頁標題 18/600「設定」；section 間隔 24px；每個 section：標題 14/600 + 一行描述 12 tertiary + 控制項。
- **主題控制**：三選 segmented control（Light / Dark / System），Lucide icon：sun / moon / monitor（16px stroke 1.75）；選中 = accent 底 + canvas 字；未選中 hover bg-hover。
- **語言控制**：兩選 segmented control（English / 繁體中文），同一組樣式。
- **主題行為**：
  - `localStorage 'otp.theme'` ∈ `light|dark|system`，預設 `system`。
  - `system`：`matchMedia('(prefers-color-scheme: dark)')` 即時監聽切換。
  - 套用：`document.documentElement.classList.toggle('light', resolved === 'light')`（index.html 既有 `.light` token block）。
  - 開機時先套用再渲染（讀 localStorage），避免閃爍。
- **語言行為**：沿用既有 `setLang()`（`localStorage 'otp.lang'` + i18next CDN / fallback）。
- **Extensibility**：App 內 `SETTINGS_SECTIONS` 資料陣列（id / title key / desc key / render fn），設定頁 map 出來；未來加 section 不動頁面骨架。
- **動效**：沿用 120/180ms opacity/transform；segment 切換 120ms；尊重 prefers-reduced-motion。

## 4. i18n 新增 keys（en + zh-TW）
- `settings.title`（設定 / Settings）
- `settings.appearance.title`（外觀 / Appearance）、`settings.appearance.desc`
- `settings.theme.light`（淺色 / Light）、`settings.theme.dark`（深色 / Dark）、`settings.theme.system`（跟隨系統 / System）
- `settings.language.title`（語言 / Language）、`settings.language.desc`
- `settings.language.en`（English）、`settings.language.zhTW`（繁體中文）

## 5. 實作映射
- `gui/src/App.tsx`：rail 設定項 active 狀態 + 點擊回 chat；新增 `SettingsView` 組件（取代 chat 欄）；移除 sidebar `lang-select`。
- `gui/index.html`：`.settings-view` / `.setting-section` / `.segmented` 樣式（用既有 tokens，不新增色票）。
- `gui/src/i18n.ts`：§4 keys。
- 主題套用邏輯：`gui/src/theme.ts`（新檔，純 function + init）或 App.tsx 內 hook——從簡。

## 6. 約束
- 純 Electron `file://`，無 dev server / DevTools；`pnpm build` + typecheck 通過。
- 只用既有 design tokens（不新增色票）；Lucide inline SVG。
- 用戶端文字大寫 **OTP**；`~/.otp/`、`window.otp` 小寫。
- 行為不回歸：worktree / session / terminal / diff / i18n 現行功能照樣。
