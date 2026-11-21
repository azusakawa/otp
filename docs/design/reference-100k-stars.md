# OTP GUI Redesign：100K+ Stars GitHub 專案設計 Pattern 研究

> 查證日期：**2026-11-21（台北時間）**
> 查證方式：GitHub REST API `GET https://api.github.com/repos/{owner}/{repo}` 取得當下 `stargazers_count`，並直接讀取各 repo 的 design token / CSS / theme 原始碼。所有數字皆為查證當下值，非記憶值、非四捨五入。
> 收錄門檻：**≥ 100,000 stars**。未達門檻者一律列於「排除清單」，即使設計很值得參考也不列入正式 benchmark（僅可作次級靈感）。
> 目的：為 OTP（Electron 多 agent 編排工具：sidebar + chat + terminal + diff）建立可被 designer 直接落地的設計語言。

---

## 0. 結論先行（給 designer 的五句話）

1. **骨架照 VS Code + Open WebUI**：48px 活動列 + 可調寬 sidebar（預設 272px，范围 220–400）+ 中央可讀寬度受限的 chat + 底部 dock + 右側 dock + 24px status bar。不要再把 260px 寫死。
2. **色彩照 shadcn/ui + VS Code Dark Modern**：拋棄 GitHub-dark 的 `#0d1117 / #161b22 / #30363d` 整套配色，改用中性灰階 surface + 半透明白色邊框 + **單一藍色 accent**；狀態色用「背景 10% / 邊框 30% / 文字 100%」三件套。
3. **字級照 Dify**：10 / 12 / 13 / 14 / 15 / 16 / 18 / 20 / 24 / 30 的 scale，base 13–14px，但**用 weight 與顏色拉層級**，不要全站 13px。聊天正文 14–15px / line-height 20–22px。
4. **圖示照 shadcn + n8n**：以 **Lucide** 為單一線性圖示族，16 / 20 / 24px，stroke 1.75；**全面移除 emoji 圖示**，狀態用「圓點 + icon + token 色」。
5. **動效照 Open WebUI + Ant Design**：120 / 180 / 240ms 三檔、ease-out 為主，只用 opacity / transform；sidebar 收合用 240ms `cubic-bezier(.22,1,.36,1)`，尊重 `prefers-reduced-motion`。

---

## 1. 查證結果總表

### 1.1 入選（≥100K，且與 OTP 的桌面／AI／編排／UI 系統相關）

| 專案 | Stars（2026-11-21） | 語言 | 在本次研究中的角色 |
|---|---:|---|---|
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | **211,555** | TypeScript | 多步驟／節點式編排的資訊架構、run 狀態、design token 分層 |
| [microsoft/vscode](https://github.com/microsoft/vscode) | **195,690** | TypeScript | Electron 桌面 shell、activity bar／sidebar／panel／status bar 骨架、Codicons |
| [langgenius/dify](https://github.com/langgenius/dify) | **161,586** | Python / TS | AI app／agent 工作台、chat composer、type scale、semantic token 命名 |
| [open-webui/open-webui](https://github.com/open-webui/open-webui) | **159,176** | Svelte | AI chat 版面、可調 sidebar、UI scale、high-contrast |
| [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | **136,028** | TypeScript | floating island／toolbar、單一品牌 accent、dark theme 策略 |
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | **128,655** | TypeScript | CSS variable token contract、oklch、radius scale、sidebar token |
| [electron/electron](https://github.com/electron/electron) | **124,027** | C++ | **架構參照**（非 UI 來源）：視窗／程序模型 |
| [microsoft/terminal](https://github.com/microsoft/terminal) | **105,465** | C++ | terminal 面板：tabs、padding、字型、透明度／材質 |
| [ant-design/ant-design](https://github.com/ant-design/ant-design) | **100,321** | TypeScript | seed → map token 架構、4px grid、motion token |
| [facebook/react](https://github.com/facebook/react) | **252,834** | JavaScript | **架構參照**（非 UI 來源）：元件組合模型 |
| [neovim/neovim](https://github.com/neovim/neovim) | **103,937** | Vim script | 次級參照：鍵盤優先、高密度、statusline 資訊設計 |

> React 與 Electron 的 star 數雖高，但本身不提供視覺語言；列入是為了標記「架構層參照」，避免把它們的 API 文件誤當設計規範。

### 1.2 排除清單（未達 100K、非 UI repo、或非 GitHub 可查證）

| 專案 | Stars（2026-11-21） | 排除原因 |
|---|---:|---|
| [mui/material-ui](https://github.com/mui/material-ui) | 99,376 | **差 624 顆未達門檻**；依規則排除（未來可重查） |
| [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | 98,715 | 未達門檻；僅作為 spacing 慣例的間接背景 |
| [zed-industries/zed](https://github.com/zed-industries/zed) | 95,440 | 未達門檻；編輯器密度可作次級靈感 |
| [ChatGPTNextWeb/NextChat](https://github.com/ChatGPTNextWeb/NextChat) | 88,980 | 未達門檻 |
| [lobehub/lobe-chat](https://github.com/lobehub/lobe-chat) | 85,926 | 未達門檻 |
| [grafana/grafana](https://github.com/grafana/grafana) | 78,021 | 未達門檻 |
| [warpdotdev/Warp](https://github.com/warpdotdev/Warp) | 66,067 | 未達門檻（且 repo 主要為 issue tracker） |
| [ghostty-org/ghostty](https://github.com/ghostty-org/ghostty) | 64,292 | 未達門檻 |
| [radix-ui/primitives](https://github.com/radix-ui/primitives) | 19,531 | 未達門檻（但 shadcn/ui 以其為 a11y 基礎） |
| [gnachman/iTerm2](https://github.com/gnachman/iTerm2) | 18,306 | 未達門檻 |
| [obsidianmd/obsidian-releases](https://github.com/obsidianmd/obsidian-releases) | 23,421 | 這是外掛／主題發布 repo，**不是 Obsidian 應用本體**；Obsidian 為閉源，無法用 GitHub stars 驗證 |
| Figma | — | 閉源，無 GitHub repo 可查證 stars；僅能作非正式靈感，不列入 benchmark |
| [tauri-apps/tauri](https://github.com/tauri-apps/tauri) | 113,030 | 達標，但屬 Electron 的替代框架，不提供 OTP 可移植的視覺 pattern |
| [flutter/flutter](https://github.com/flutter/flutter) | 181,319 | 達標但為跨平台框架，視覺語言來自 Material，與桌面編排工具關聯低 |
| [ollama/ollama](https://github.com/ollama/ollama) | 187,769 | 達標但無 GUI |
| [langchain-ai/langchain](https://github.com/langchain-ai/langchain) | 149,985 | 達標但無 GUI |
| [vercel/next.js](https://github.com/vercel/next.js) | 143,627 | 達標但為 web framework，非 UI 來源 |
| [mrdoob/three.js](https://github.com/mrdoob/three.js) | 119,038 | 達標但與 OTP 介面無關 |
| [twbs/bootstrap](https://github.com/twbs/bootstrap) | 175,103 | 達標，但設計語彙偏傳統 web；僅 4px/8px grid 可間接參考 |

---

## 2. 各專案深度分析

### 2.1 VS Code（Electron 桌面應用的基準線）

**Layout**
- 典型五區：`activity bar`（左側 48px 圖示列）→ `sidebar`（預設 300px，最小 170px，可拖拽、可隱藏）→ `editor`（中央彈性）→ `panel`（底部，可拖拽）→ `status bar`（底部 22px）。
- 區塊之間以 **1px 邊框**分隔，不使用陰影堆疊；sidebar 的 viewlet 是**可折疊 section**，header 可 hover 才顯示動作（keyboard a11y 用 `width:0` 而非 `display:none`）。
- 原始碼依據：`src/vs/workbench/browser/parts/sidebar/sidebarPart.ts`（`minimumWidth = 170`、`Math.max(width, 300)`）、`parts/activitybar/media/activitybarpart.css`（`--activity-bar-width: 48px`）。

**Typography**
- 依平台切換系統字族：macOS `-apple-system, BlinkMacSystemFont`；Windows `"Segoe WPC", "Segoe UI"`；CJK 再補 `PingFang SC` / `Hiragino Sans GB` / `Microsoft YaHei` 等。
- UI base **13px**、status bar **11px**、行高約 `1.4em`；codicon 以 16px 字型對齊 13px 文字（`padding-left: 3px` 讓 16px 圖示與 13px 字視覺居中）。
- 出處：`src/vs/workbench/browser/media/style.css`。

**Color（Dark Modern，實際 hex）**
- `editor.background #1F1F1F`、`sideBar.background #181818`、`panel.background #181818`、`statusBar.background #181818`
- 邊框 `sideBar.border / panel.border / statusBar.border #2B2B2B`；editor group 邊框用 `#FFFFFF17`（半透明白）
- 文字 `foreground #CCCCCC`、`descriptionForeground #9D9D9D`、placeholder `#989898`
- accent `focusBorder / button.background / activityBar.activeBorder #0078D4`，hover `#026EC1`
- 狀態 `errorForeground #F85149`、`editorGutter.addedBackground #2EA043`
- 出處：`extensions/theme-defaults/themes/dark_modern.json`。
- **重點**：VS Code 不是「黑色 + 藍色按鈕」而已，而是「多層中性灰 + 半透明邊框 + 單一 Azure accent + 少量狀態色」。這正是 OTP 現行 GitHub-dark 最缺的層次。

**Spacing**
- 4px 為基礎節奏；列表列高約 22–24px、toolbar 32px、section header 22px；padding 多為 8/12/16px。整體屬於**高密度**，但不把 11px 當正文。

**Iconography**
- **Codicons**：以 icon font 實作，`codiconsLibrary.ts` 中註冊 **764** 個圖示；工作台統一 16px。線性、單色、可繼承 `currentColor`。
- 不使用 emoji 作為功能圖示。

**Motion**
- 非常克制：以 `fadeIn`（opacity 0→1）與 hover 過渡為主，幾乎沒有彈性動畫；面板展開／收合優先使用即時 layout，而不是長時間 width 動畫。
- 出處：`src/vs/workbench/browser/media/style.css` 的 `@keyframes fadeIn`。

**Empty state / 引導**
- Welcome / Get Started 頁：最近開啟項目、快捷鍵提示、walkthrough 清單；空白編輯器也會顯示 keybinding 提示。
- 學習點：**空白區不是放插圖，而是放「下一步動作 + 快捷鍵」**。

**可直接移植到 OTP**
- 48px activity rail + 可折疊 sidebar section + 底部 dock + 22–24px status bar。
- 1px `border.subtle` 分区，不用卡片堆疊。
- 命令面板（Ctrl/Cmd+K）作為多 agent 操作主入口。
- 注意：不要照抄 11px 與 22px 列高；OTP 的 chat 是閱讀介面，需要更放鬆。

---

### 2.2 n8n（最貼近「多 agent 編排」的資訊架構）

**Layout**
- 中央是 **workflow canvas**（可縮放、可平移、節點連線），左側是 node / workflow 導航與執行列表，右側或覆蓋層是 **NDV（Node Details View）** 參數面板，底部是執行紀錄／log。
- 心智模型非常適合 OTP：**「編排畫布（或 run timeline）＋ 選中節點的詳情面板＋底部執行輸出」**。OTP 不一定要做畫布，但可以借「run inspector」：左側 sessions、中央對話、右側 agent/run 詳情、底部 terminal/log。
- 節點執行狀態（running / success / error / waiting）以顏色與邊框同時表達，而非只靠文字。

**Typography**
- 實際 scale：`8 / 10 / 12 / 13 / 14 / 16 / 18 / 20 / 28px`；base 14px，13px 用於次要 UI，12px metadata。
- 出處：`packages/frontend/@n8n/design-system/src/css/_primitives.scss`（`--font-size--3xs: .625rem` … `--font-size--2xl: 1.75rem`）。

**Color**
- 三層 token：**primitives（oklch 色階）→ theme（semantic）→ component（--tag--、--node--、--canvas--）**。
- Primitive 用 oklch：`--color--neutral-50: oklch(98.51% 0 89.88)`、`neutral-950: oklch(20.46% 0 89.88)`；品牌粉紅 `--color--pink-500: oklch(78.07% 0.136 5.02)`。
- Semantic 狀態是**四件套**：`--background--success`、`--border-color--success`、`--text-color--success`、`--icon-color--success`；danger / warning / info 同樣結構。
- 有 `--background--surface / subtle / hover / active / disabled`，hover 用黑色 alpha 疊加（light theme），代表「狀態色是疊層，不是新色票」。
- 出處：`packages/frontend/@n8n/design-system/src/css/_tokens.scss`。

**Spacing / Radius**
- Spacing：`2 / 4 / 6 / 8 / 12 / 16 / 20 / 24 / 32px`（`--spacing--5xs` 到 `--spacing--xl`）。
- Radius：`2 / 4 / 6 / 8 / 12 / 14 / 16 / 18 / 20 / full`；預設 `--radius: 8px`。
- 控制項高度另有 `--height--*`，避免 spacing 與 control height 混用。

**Iconography**
- `N8nIcon` 同時支援自家 icon set、node icons 與 **Lucide fallback**；有 `size` / `color` / `strokeWidth` / `spin` 等 props。
- 重要：icon 顏色走 token（`--node--icon--color--blue` 這類），不是硬編 hex。

**Motion**
- 節點狀態切換、canvas zoom／pan、NDV 進出以短過渡為主；不依賴花俏動畫傳達狀態，而是顏色＋icon＋文字。

**Empty state**
- 空白 canvas 提供「Add first step」與 templates／trigger 提示；執行列表為空時引導建立 workflow。
- 學習點：**空狀態要教會使用者這個空間的語法**（什麼是 node、什麼是 run）。

**可直接移植到 OTP**
- 右側「Run Inspector」：顯示目前 agent、模型、工具呼叫、耗時、token、錯誤，對應 n8n NDV。
- 狀態色四件套 token；agent 卡片用左側 2px 狀態條 + 背景 tint，而不是整張卡片變色。
- Token 分層（primitive → semantic → component）直接套用到 OTP CSS variables。

---

### 2.3 Dify（AI 工作台的 type scale 與 semantic token 範本）

**Layout**
- App shell：左側主導航（apps / knowledge / tools）＋中央工作區（chat 或 workflow canvas）＋右側設定／debug 面板；chat 頁的 composer 固定在底部，上方有 **gradient mask** 讓訊息淡出。
- Workflow 編輯器與 chat 共用同一套 shell 與 token，這是 OTP 應學的「同一設計語言跨模式」。

**Typography（本報告最推薦直接採用的 scale）**
- 實際 utilities（`packages/dify-ui/src/styles/utilities.css`）：
  - `system-2xs`：10px / 12px
  - `system-xs`：12px / 16px
  - `system-sm`：13px / 16px
  - `system-md`：14px / 20px
  - `system-lg`：15px / 20px（`body-lg`）
  - `system-xl`：16px / 24px
  - `title-2xl` 18px、`title-3xl` 20px、`title-4xl` 24px、`title-5xl` 30px（line-height 1.2）
- Weight 僅 400 / 500 / 600 / 700，且 body 幾乎只用 400/500，標題用 600。
- **13px 留給 sidebar / 次要 UI；14px 才是 chat 正文；16–20px 留給 panel 標題。**

**Color**
- 用 `html[data-theme='light'|'dark']` 切換，token 名稱是 semantic／component 層級：`--color-components-panel-bg`、`--color-text-primary`、`--color-chat-bubble-bg`、`--color-chat-input-mask` 等。
- 大量使用「極低對比漸層」處理 chat 背景、輸入遮罩、失敗／警告執行列：例如 dark 的 `--color-chatbot-bg` 是 `rgba(34,34,37,.9) → rgba(29,29,32,.9)`；失敗列是紅色 12–14% alpha 漸層到透明。
- 有 `glass-surface` utility（`backdrop-blur(5px)` + 多層 box-shadow + 1px 反光邊），但只用於浮動主導航，不濫用。
- 出處：`web/themes/manual-light.css`、`manual-dark.css`、`web/app/styles/glass-surface.css`、`tailwind-core.css`。

**Spacing**
- Tailwind v4 CSS-first（`@theme`，無 tailwind.config）；預設 0.25rem（4px）節奏；breakpoint 另訂 `mobile 100 / tablet 640 / pc 769 / 2k 2560`。

**Iconography**
- 依賴 `@heroicons/react`、`@remixicon/react` 與 `@iconify-json/*`；圖示以 16/20px 線性為主。多圖示庫是歷史包袱，不建議 OTP 模仿「混用」，但可學其「圖示由 design system 統一出口」。

**Motion**
- 使用 `motion`（Framer Motion 系）處理進場／面板；多數為 150–250ms opacity/transform；gradient mask 讓內容切換不閃爍。

**Empty state**
- Chat 首頁：中央 greeting + 模型選擇 + suggestion prompts；workflow 空白：template 卡片。不是單純「No data」。

**可直接移植到 OTP**
- 直接採用 Dify 的 type scale（見 §4.3）。
- Composer 底部 gradient mask（避免訊息硬切）。
- Token 命名用 `--color-bg-* / --color-text-* / --color-border-* / --color-status-*`。
- Glass 只用於 command palette、浮動 toolbar、composer 的 hover 狀態。

---

### 2.4 Open WebUI（sidebar 尺寸、collapse motion、UI scale 的實作範本）

**Layout**
- Sidebar 預設 **245px**，可拖拽範圍 **220–480px**，使用 CSS variable `--sidebar-width`；小螢幕改成 overlay。
- Sidebar 收合動畫：`width 250ms cubic-bezier(0.22, 1, 0.36, 1)`；行動版 overlay 以 `fade` 50ms。
- Chat 區使用 container queries（`@container`）與 `max-w` 約束閱讀寬度；背景可加 cover image + gradient overlay，但預設是低對比。
- 出處：`src/lib/components/layout/Sidebar.svelte`、`src/routes/(app)/+layout.svelte`。

**Typography**
- 自帶 **Inter Variable**（`@font-face`，`font-display: swap`）；sidebar chat item 13px（`0.8125rem`），行高 20px；chat 正文 15px（`text-[0.9375rem]`）。
- 有全域 **UI text scale**：`--app-text-scale` 同時縮放 root font-size、sidebar 高度、padding、icon 間距，讓使用者可整體放大而不爆版。這是桌面工具很值得抄的無障礙設計。

**Color**
- Tailwind gray scale + `.dark` class；另有 `html.high-contrast` 覆寫，將 gray-400/500 提升到 gray-300/700，確保 WCAG。
- 狀態色仍用 Tailwind 的 red/blue 系，但 high-contrast 會整套替換，不是只改一個變數。

**Spacing / density**
- Sidebar item：`min-height 32px`、inline padding 11px、block padding 6px；列表偏鬆，適合長時間點擊。
- 圖示按鈕多為 32–36px 點擊區。

**Iconography**
- `heroicons` + `iconoir`；以 outline 為主，尺寸 16–20px；沒有 emoji 功能圖示。

**Motion**
- 250ms sidebar、50ms fade、`transition` 用於 hover 顏色；不使用誇張彈跳。

**Empty state**
- 新對話中央顯示 greeting、模型下拉、建議提示；sidebar 無對話時显示「New Chat」引導。

**可直接移植到 OTP**
- Sidebar 以 px 變數 + min/max 約束 + localStorage 記憶寬度。
- UI scale（80%–120%）與 high-contrast 模式。
- 32px 列的 sidebar item；用 hover 背景 `white/5` 而非整列變色。

---

### 2.5 Excalidraw（floating island 與單一品牌色）

**Layout**
- 全螢幕 canvas，工具列是**浮動 island**（左上），右側屬性面板也是浮動 island；沒有傳統三欄。適合 OTP 的「terminal / diff 浮動工具列」或「command palette」。
- 面板之間用圓角、陰影與半透明背景區隔，而不是切滿版。

**Typography**
- UI 小型化：`0.75rem`（12px）用於 toolbar label、keybinding；正文與對話不在這個產品範圍。
- 字族沿用系統 UI，canvas 內文字才是 Excalidraw 自訂字型。

**Color**
- Light 預設 `#fff`；dark 用 `#121212`（比 GitHub `#0d1117` 更中性），surface 用 `#1e1e1e` 等級。
- 品牌紫：`--color-primary-darker #5b57d1`、`--color-primary-darkest #4a47b1`；light surface `#f1f0ff`、`#f6f6f9`、`#ececf4`。  
- 重要：**有明確品牌色（violet），但不把它鋪滿介面**；accent 只出現在選中工具、focus、主要按鈕。
- 狀態色（danger / warning / success）有完整的 dark 變體，不是直接沿用 light hex。
- 出處：`packages/excalidraw/css/theme.scss`、`variables.module.scss`。

**Spacing / Radius**
- 小 spacing、radius `--border-radius-md: 6px`、`--border-radius-lg: 8px`；按鈕與 island 一致。

**Iconography**
- 自製 SVG icon set（工具列多為 filled），每個工具都有 keybinding 小標；icon 與快捷鍵一起出現，降低學習成本。

**Motion**
- Canvas 操作（拖拽、縮放、laser pointer）以即時回饋為主；UI 過渡短、不打斷繪圖。

**Empty state**
- 空白畫布本身是邀請；角落提示「點擊工具開始畫」與快捷鍵。

**可直接移植到 OTP**
- 浮動 island 用於 terminal 工具列、diff 檢視切換、chat 附件列。
- 單一品牌色（OTP Blue）只用在 focus／primary／選中，不用於大面積背景。
- 每個 icon-only 按鈕都应有 tooltip + 快捷鍵。

---

### 2.6 shadcn/ui（token contract 與 oklch）

**Layout**
- 不提供 app shell，但提供 sidebar 專用 token（`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`），以及 `Sidebar` 元件的 collapsible / inset / floating 變體。這讓「sidebar 是一等公民」，與 OTP 高度相關。

**Color**
- 以 CSS variables 作為公開合約：`background / foreground / card / popover / primary / secondary / muted / accent / destructive / border / input / ring / chart-1..5 / sidebar-*`。
- 使用 **oklch**（perceptually uniform），dark theme 的 border 是 `oklch(1 0 0 / 10%)`、input 是 `15%`、ring 是 `oklch(0.556 0 0)`；這比固定 hex 更能保持深浅主題一致。
- Dark neutral 範例：`background oklch(0.145 0 0)`、`card oklch(0.205 0 0)`、`muted-foreground oklch(0.708 0 0)`、`primary oklch(0.922 0 0)`（近白，不是藍）。
- 出處：`apps/v4/registry/themes.ts`、`apps/v4/app/globals.css`。

**Radius / Spacing**
- `--radius: 0.625rem`（10px），再推導 `sm .6× / md .8× / lg 1× / xl 1.4× / 2xl 1.8× / 3xl 2.2× / 4xl 2.6×`。**用一個 base radius 推導全站**，避免 6/8/10/12 混用。
- Spacing 走 Tailwind 4px 制。

**Iconography**
- 官方範例以 **Lucide** 為主，`size-4`（16px）為預設；圖示被視為「文字的一部分」，跟隨 `currentColor`。

**Motion**
- 依賴 `tw-animate-css` 與 `motion`；元件進出以 150–200ms fade/scale 為主，overlay 用 fade，避免大幅位移。

**Empty state**
- 文件與 block 範例多為「標題 + 說明 + 單一 CTA」，不塞插圖。

**可直接移植到 OTP**
- 直接把 shadcn 的 token contract 當 OTP 的 CSS variable 介面；設計師只需改 `:root` / `.dark` 一處。
- 用單一 `--radius` 推導元件的圓角。
- Sidebar 專屬 token，讓 sidebar 可以有獨立 surface 而不破壞主色。

---

### 2.7 Ant Design（seed → map token 與 motion 參數）

**Layout**
- 企業級元件庫，不規範 app shell；但其 `Layout`（Sider / Header / Content / Footer）與 `Splitter` 常用於桌面工具。元件密度偏中高。

**Typography**
- Seed `fontSize: 14`；由 `genFontSizes` 以 `base * e^(i/5)` 產生 10 級並取偶數，前 7 級為 **12 / 14 / 16 / 18 / 20 / 22 / 24**（heading 再往上取用）。
- 行高公式 `(fontSize + 8) / fontSize`：14px → 1.571、12px → 1.667、16px → 1.5。這让不同字級有「視覺行高一致」的效果。
- 字族：`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif` + emoji fallback；code 用 `SFMono-Regular, Consolas, ...`。
- 出處：`components/theme/themes/seed.ts`、`shared/genFontSizes.ts`。

**Color**
- Seed：`colorPrimary #1677ff`、`colorSuccess #52c41a`、`colorWarning #faad14`、`colorError #ff4d4f`、`colorInfo #1677ff`。
- 由 seed 派生 10 階 palette 與 neutral palette；**不改元件，只改 seed** 就能全域換膚。
- 出處：`components/theme/themes/seed.ts`、`default/index.ts`。

**Spacing**
- `sizeUnit: 4`、`sizeStep: 4` → `sizeXXS 4 / XS 8 / SM 12 / MD 20 / MS 16 / LG 24 / XL 32 / XXL 48`；`controlHeight: 32`。
- Radius 6px。

**Motion**
- `motionUnit: 0.1`（100ms 為單位）；`motionEaseOut: cubic-bezier(0.215, 0.61, 0.355, 1)`、`motionEaseInOut: cubic-bezier(0.645, 0.045, 0.355, 1)`、`motionEaseOutCirc: cubic-bezier(0.08, 0.82, 0.17, 1)`。
- 建議採用「100ms 為基本單位」的概念，而不是每個元件隨便寫 150/200/300。

**Empty state**
- `Empty` 元件：插圖 + 標題 + 說明 + action；企業場景常用「建立第一個 X」。

**可直接移植到 OTP**
- Token 分層與 motion 曲線。
- Control height 32px 作為 toolbar / input 的基準。
- 用 seed 的概念管理「品牌色 / 狀態色」，不要在元件裡硬寫。

---

### 2.8 Windows Terminal（terminal dock 的細節規範）

**Layout**
- Tab bar + 可分割 panes（水平／垂直），每個 pane 是獨立 shell；tab 可拖拽、可rename、可color。
- 全域設定與 profile 分離；terminal 內容區可設 padding。

**Typography**
- 預設字型 **Cascadia Mono**、預設字級 **12pt**（可調）；等寬、高 x-height，適合長時間閱讀。
- 出處：Microsoft Learn「Windows Terminal Appearance Profile Settings」。

**Color / 材質**
- 支援 color schemes（Campbell、One Half Dark 等）、前景／背景／游標／選取色各自獨立。
- 透明度 `opacity 0–100`（預設 100）；`useAcrylic: true` 時用 acrylic 模糊，否則用不模糊的 opacity；Windows 11 支援 Mica。預設 padding `8, 8, 8, 8`。
- 重點：**terminal 的「背景材質」是可选圖層，不是預設**；內容清楚優先。

**Spacing**
- 預設 8px 四面 padding；行高由字型決定；scrollbar 可設 `visible / hidden`。

**Iconography**
- tab 使用 profile icon（可自訂）；工具列極簡，功能多在右鍵／命令面板。

**Motion**
- 幾乎沒有裝飾性動畫；tab 切換、pane 分割以即時為主。

**Empty state**
- 新 tab 直接開 shell prompt，不解釋太多；設定頁有範例與 JSON schema。

**可直接移植到 OTP**
- Terminal 面板：tab 32px、內容 padding 12px、mono 12.5–13px、行高 1.5、ANSI palette 降飽和。
- 背景透明度／模糊只作為使用者選項，預設關閉。
- Scrollbar 預設細而可見，hover 才變粗。

---

### 2.9 架構層參照：Electron / React（不作为视觉来源）

- **Electron**：只決定視窗、程序、檔案系統能力；UI 仍由 web layer 決定。OTP 用 `file://` 載入 `dist/`，因此 design token 必須在 build 時就存在，不能依賴 dev server HMR。
- **React**：元件組合與狀態模型；不提供視覺規範。可借鏡「compound component」與「controlled/uncontrolled」概念來設計 OTP 的 panel/command 元件 API。
- **Neovim**：鍵盤優先、statusline 資訊密度、modal editing；可作 OTP command palette 與快捷鍵體系的次級參考，但不要抄它的字型與配色。

---

## 3. 跨專案 Pattern 綜合

| 維度 | 100K+ 專案的共識 | 對 OTP 的含義 |
|---|---|---|
| **Layout** | 固定 nav rail + 可調 sidebar + 中央彈性區 + 可折疊 dock；panel 有 min/max；1px 分隔 | 保留 sidebar/chat/terminal/diff，但全部改為可調、可折疊、有記憶 |
| **Typography** | base 13–14px；12px metadata；16–20px 標題；3–4 個 weight；line-height 1.4–1.5 | 建立 7 級 type scale，chat 正文 14–15px |
| **Color** | 中性深灰 surface（非純黑）＋半透明邊框＋單一 accent＋少量狀態色；light/dark 同一 token 名 | 移除 GitHub-dark 的藍黑整套，改用中性灰 + OTP Blue |
| **Spacing** | 4px 制；2/4/6/8/12/16/20/24/32；control height 28/32/36 | 用 4px scale，sidebar row 32px，panel padding 12–16px |
| **Radius** | 6–10px 為主；由單一 base radius 推導 | `--radius: 8px`，推導 sm/md/lg/xl |
| **Icon** | 16/20px 線性單色；跟隨 currentColor；不用 emoji | Lucide，16/20/24，stroke 1.75 |
| **Motion** | 100–250ms；ease-out；opacity/transform；尊重 reduced motion | 120/180/240ms 三檔 |
| **Empty state** | 標題 + 一句說明 + 單一 CTA + 快捷鍵／模板 | 每個 panel 都要有「下一步」 |
| **Density** | 桌面工具可緊湊，但閱讀區放鬆；sidebar 32px 列 | sidebar 緊、chat 鬆、terminal 中 |

---

## 4. OTP 應採用的設計語言（建議）

### 4.1 Layout 骨架

```
┌──────────────────────────────────────────────────────────────────────┐
│ Title bar 36px（可拖拽；左：OTP 標記 / 中：worktree 名稱 / 右：視窗控制）│
├──────┬───────────────┬───────────────────────────────┬───────────────┤
│ Rail │ Sidebar       │ Main                          │ Diff          │
│ 48px │ 272px         │ Chat（max-width 760px 居中）   │ 380px         │
│      │ min 220       │                               │ min 300       │
│      │ max 400       │ ┌───────────────────────────┐ │ max 520       │
│      │               │ │ Terminal dock 200px       │ │               │
│      │               │ │ min 140 / max 360         │ │               │
├──────┴───────────────┴───────────────────────────────┴───────────────┤
│ Status bar 24px（agent run 狀態、分支、模型、耗時、快捷鍵提示）        │
└──────────────────────────────────────────────────────────────────────┘
```

- **Rail 48px**（VS Code activity bar）：Worktrees / Sessions / Terminal / Diff / Settings，icon 24px，選中用左側 2px accent bar + surface tint。
- **Sidebar 272px**（Open WebUI 245 + VS Code 300 的中間值）：分「Worktrees」「Sessions」兩個可折疊 section；section header 28px、row 32px、padding 8/12px。可拖拽 220–400px，雙擊 divider 重設。
- **Chat**：內容 `max-width: 760px`（單欄閱讀），左右 padding 24–32px；訊息之間 16–20px；composer 固定在底部，底部加 24px gradient mask。  
- **Terminal dock**：預設 200px（現行 180 太淺），min 140 / max 360；tab 32px；內容 padding 12px；可關閉、可最大化。
- **Diff dock**：預設 380px，min 300 / max 520；頂部 32px toolbar（inline / side-by-side、previous / next change）；可從右側滑出。
- **Status bar 24px**：不要 11px 螞蟻字；用 12px，重要狀態用 icon + 色點。
- **Command palette**：Ctrl/Cmd+K，浮動 island（Excalidraw / shadcn），寬 560px，最大高度 420px。
- **鍵盤**：所有 panel 可 `Ctrl/Cmd+1..4` 切換、`Ctrl/Cmd+B` sidebar、`Ctrl/Cmd+J` terminal、`Ctrl/Cmd+Shift+D` diff。

### 4.2 Color token 方向

**原則**：中性 surface 打底、半透明邊框分層、單一藍色 accent、狀態色只出現在狀態處。用 oklch 定義（shadcn），但提供 hex fallback。

| Token | Dark 建議值 | 用途 | 參考來源 |
|---|---|---|---|
| `--bg-canvas` | `#1a1a1c` | 最底層工作區 | VS Code `#1F1F1F` / Excalidraw `#121212` 之間 |
| `--bg-surface` | `#202023` | sidebar / panel | shadcn `card 0.205` |
| `--bg-elevated` | `#26262a` | popover / command palette | shadcn `popover` |
| `--bg-hover` | `rgba(255,255,255,.06)` | hover 疊層 | n8n alpha hover |
| `--bg-active` | `rgba(255,255,255,.10)` | active / selected | n8n / Open WebUI |
| `--border-subtle` | `rgba(255,255,255,.08)` | 一般分隔 | shadcn dark border 10% |
| `--border-strong` | `rgba(255,255,255,.14)` | 輸入框 / 焦點區 | shadcn input 15% |
| `--text-primary` | `#e6e6e8` | 正文 | VS Code `#CCCCCC` 提亮 |
| `--text-secondary` | `#a0a0a8` | 次要說明 | VS Code `#9D9D9D` |
| `--text-tertiary` | `#6f6f78` | placeholder / disabled | VS Code `#6E7681` |
| `--accent` | `#4f8cff` | 主要 action / focus | VS Code Azure `#0078D4` + Dify blue 的現代化 |
| `--accent-hover` | `#6ba1ff` | hover |  |
| `--accent-pressed` | `#3a73e0` | pressed |  |
| `--success` | `#2ea043` | 成功 / 完成 | VS Code |
| `--warning` | `#d29922` | 警告 / 等待 | VS Code / GitHub 系 |
| `--danger` | `#f85149` | 錯誤 / 刪除 | VS Code |
| `--info` | `#58a6ff` | 資訊 |  |
| `--focus-ring` | `rgba(79,140,255,.55)` | 2px ring | shadcn ring |

**狀態四件套**（照 n8n）：
```css
--status-success-bg: color-mix(in oklch, var(--success) 12%, transparent);
--status-success-border: color-mix(in oklch, var(--success) 32%, transparent);
--status-success-text: var(--success);
--status-success-icon: var(--success);
```
- Agent 卡片：左側 2px 狀態條 + `bg` 12% tint；不要整張卡片染成紅／綠。
- 執行中：accent 色 + 緩慢 pulse；等待：warning；失敗：danger；完成：success。
- **不要**再把 `#58a6ff` 當唯一 accent 鋪滿連結、按鈕、選中、icon；accent 只保留給「主要動作 + focus + 選中」。

**Light theme**：同一組 token 名，`--bg-canvas #fafafa`、`--bg-surface #ffffff`、`--border-subtle rgba(0,0,0,.08)`、`--text-primary #18181b`、`--accent #2563eb`。不要用「dark 反轉」硬做。

### 4.3 Typography

| Token | Size / Line-height | Weight | 用途 |
|---|---|---|---|
| `--text-display` | 24 / 30 | 600 | 頁面／空狀態主標 |
| `--text-title` | 18 / 24 | 600 | panel 標題、worktree 名稱 |
| `--text-subtitle` | 16 / 24 | 600 | section 標題 |
| `--text-body` | 14 / 22 | 400 | chat 訊息、diff 內容 |
| `--text-ui` | 13 / 18 | 400 / 500 | sidebar、toolbar、按鈕 |
| `--text-meta` | 12 / 16 | 400 / 500 | 時間、token 數、狀態 |
| `--text-micro` | 11 / 14 | 500 | badge（僅少量） |
| `--text-mono` | 12.5 / 20 | 400 | terminal、code、diff |

- **UI 字族**：`Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`（Inter 可選，Open WebUI 已驗證可用 variable font）。
- **Mono**：`"JetBrains Mono", "Cascadia Code", "SFMono-Regular", Consolas, monospace`。
- Weight 只用 400 / 500 / 600；不要用 700 到處強調。
- 中文不要用 Inter 硬扛；一定要把 `PingFang SC` / `Microsoft YaHei` / `Noto Sans SC` 放進 stack。
- **13px 不再是唯一 base**：sidebar 13、chat 14、標題 16–18、meta 12。

### 4.4 Iconography

- **單一圖示族：Lucide**（shadcn 官方範例、n8n 的 fallback 都用它；Lucide 本身 2026-11-21 為 25,892 stars，未達 100K，因此它是「實作選擇」而非 benchmark 專案）。
- 尺寸：16px（inline / 按鈕）、20px（toolbar / sidebar）、24px（rail / 空狀態）。
- Stroke：1.75（16–20px）、1.5（24px）；顏色一律 `currentColor`，由 token 控制。
- 每個 icon-only 按鈕都要有 `aria-label` + tooltip + 快捷鍵（Excalidraw 的 keybinding 小標）。
- **移除 emoji 功能圖示**；品牌／agent 頭像可用單色字母或簡單 geometric mark，不要用 🦞🔥🚀 這種。
- 狀態用「圓點 + icon」：`● running`、`✓ done`、`! error`，顏色走狀態 token。

### 4.5 Motion

| Token | Duration | Easing | 用途 |
|---|---|---|---|
| `--motion-fast` | 120ms | `cubic-bezier(.2,.8,.2,1)` | hover / press / icon 切換 |
| `--motion-base` | 180ms | `cubic-bezier(.22,1,.36,1)` | popover / tooltip / tab |
| `--motion-slow` | 240ms | `cubic-bezier(.22,1,.36,1)` | sidebar / diff 收合 |
| `--motion-exit` | 120ms | `ease-in` | 關閉 / 消失 |

- 只用 `opacity` / `transform`；**不要 animate `width`**（Open WebUI 的 250ms width 是可用但有 layout thrash 風險；OTP 用 `transform: translateX` + clip 或 `grid-template-columns` 過渡）。
- Chat 訊息進場：`opacity 0→1` + `translateY(4px)→0`，180ms；streaming 時不要每 token 重播。
- Thinking / running：低頻 pulse（1.6s），不要 spin 整張卡片。
- `prefers-reduced-motion: reduce` → 全部降為 0ms，只保留顏色變化。

### 4.6 Empty state / 引導

| 區域 | 空狀態設計 |
|---|---|
| Sidebar（無 worktree） | 標題「No worktrees yet」+ 說明 + `Add worktree` 主按鈕 + `⌘O` 提示 |
| Sidebar（無 session） | 「Start a session」+ 3 個 suggestion（Review PR、Fix bug、Explain repo） |
| Chat | 中央 greeting + 模型／agent 選擇 + 3–4 個 prompt cards（Dify / Open WebUI） |
| Terminal | 「No terminal running」+ `Open terminal` + `⌘J`；不要只顯示黑畫面 |
| Diff | 「Select a file to see changes」+ 說明 diff 來源（working tree / commit） |
| Command palette | 最近使用 + 快捷鍵列表 |
| 第一次啟動 | 3 步 checklist：Add worktree → Start session → Run agent；完成後自動消失 |

### 4.7 應該抄 / 不該抄

**抄**
- VS Code 的區塊骨架、1px 分隔、可折疊 section、command palette。
- Open WebUI 的 sidebar 寬度記憶 + UI scale + high-contrast。
- Dify 的 type scale、semantic token、composer gradient mask。
- n8n 的狀態四件套、primitive→semantic→component 三層 token、run inspector 心智模型。
- shadcn 的 CSS variable contract、oklch、單一 radius 推導、sidebar token。
- Excalidraw 的 floating island、單一品牌色、keybinding 小標。
- Windows Terminal 的 8px padding、mono 12–13px、透明度可選。

**不該抄**
- GitHub-dark 的 `#0d1117 / #161b22 / #30363d` 整套配色（這是本次 redesign 的起點問題）。
- 全站 13px、11px status bar、22px 列高（閱讀區會太擠）。
- emoji 當功能圖示。
- 260px 寫死 sidebar、180px 寫死 terminal。
- 卡片包卡片、每個區塊都加邊框 + 陰影。
- 多個 accent 色互相競爭（藍 + 紫 + 綠）。
- 把 terminal 預設做成半透明／毛玻璃；內容可讀性優先。

---

## 5. OTP 區域 → Pattern 對照表

| OTP 區域 | 主要參考 | 具體做法 |
|---|---|---|
| Activity rail | VS Code | 48px、24px icon、左側 2px accent、tooltip + shortcut |
| Sidebar | VS Code + Open WebUI | 272px（220–400）、可折疊 section、32px row、寬度記憶 |
| Worktree 卡片 | n8n | 左側狀態條 + 名稱 + 分支 + 路徑；hover 才顯示 actions |
| Session 列表 | Open WebUI | 13px 標題、12px meta、選中 surface tint、雙擊 rename |
| Chat | Dify + Open WebUI | max-width 760、14/22 正文、訊息分組、底部 gradient mask |
| Composer | Dify | 圓角 10px、border-strong、focus ring、附件／模型／送出三段式 |
| Agent 狀態 | n8n | 四件套 token、run inspector、耗時／token／工具呼叫 |
| Terminal | Windows Terminal + VS Code | tab 32px、padding 12px、mono 12.5、ANSI 降飽和 |
| Diff | VS Code | 380px dock、inline/side-by-side、+/- 色只用文字背景 12% |
| Status bar | VS Code | 24px、12px 字、run 狀態／分支／模型／快捷鍵 |
| Command palette | VS Code + Excalidraw | 浮動 island、560px、最近使用、模糊搜尋 |
| 空狀態 | Dify + VS Code | 標題 + 說明 + CTA + shortcut，不用大插圖 |
| 設定 | shadcn | sidebar token、theme / UI scale / high contrast |

---

## 6. 给 designer 的落地順序（建議）

1. **先改 token，不改元件**：建立 `tokens.css`（§4.2–4.5），把現有 GitHub-dark hex 全部映射過去。這一步就能讓介面「不像 GitHub」。
2. **再改 shell**：rail 48 / sidebar 272 / status 24 / terminal 200 / diff 380，全部可拖拽 + 記憶。
3. **改 type scale**：13px 全站 → 分級；chat 14px、標題 16–18px。
4. **換 icon**：emoji → Lucide；補 tooltip / shortcut。
5. **最后加 motion / empty state**：不要在架構未定時先做動畫。

---

## 7. 查證來源

### Star 數
- GitHub REST API：`https://api.github.com/repos/{owner}/{repo}`，查詢時間 2026-11-21。
- 已逐一查詢：`n8n-io/n8n`、`microsoft/vscode`、`langgenius/dify`、`open-webui/open-webui`、`excalidraw/excalidraw`、`shadcn-ui/ui`、`electron/electron`、`microsoft/terminal`、`ant-design/ant-design`、`facebook/react`、`neovim/neovim`，以及排除清單中的 `mui/material-ui`、`tailwindlabs/tailwindcss`、`zed-industries/zed`、`ChatGPTNextWeb/NextChat`、`lobehub/lobe-chat`、`grafana/grafana`、`warpdotdev/Warp`、`ghostty-org/ghostty`、`radix-ui/primitives`、`gnachman/iTerm2`、`obsidianmd/obsidian-releases`、`tauri-apps/tauri`、`flutter/flutter`、`ollama/ollama`、`langchain-ai/langchain`、`vercel/next.js`、`mrdoob/three.js`、`twbs/bootstrap`。

### 原始碼／文件
- VS Code：`src/vs/workbench/browser/parts/sidebar/sidebarPart.ts`、`parts/activitybar/media/activitybarpart.css`、`src/vs/workbench/browser/media/style.css`、`extensions/theme-defaults/themes/dark_modern.json`、`src/vs/base/common/codiconsLibrary.ts`（764 個 codicon）。
- n8n：`packages/frontend/@n8n/design-system/src/css/_primitives.scss`、`_tokens.scss`、`src/components/N8nIcon/Icon.vue`。
- Dify：`packages/dify-ui/src/styles/utilities.css`、`web/app/styles/tailwind-core.css`、`web/themes/manual-light.css`、`manual-dark.css`、`web/app/styles/glass-surface.css`。
- Open WebUI：`src/lib/components/layout/Sidebar.svelte`、`src/routes/(app)/+layout.svelte`、`src/app.css`、`tailwind.config.js`。
- Excalidraw：`packages/excalidraw/css/theme.scss`、`variables.module.scss`、`packages/common/src/colors.ts`。
- shadcn/ui：`apps/v4/app/globals.css`、`apps/v4/registry/themes.ts`、`apps/v4/package.json`。
- Ant Design：`components/theme/themes/seed.ts`、`shared/genFontSizes.ts`、`shared/genFontMapToken.ts`、`shared/genSizeMapToken.ts`。
- Windows Terminal：Microsoft Learn「Windows Terminal Appearance Profile Settings」（padding 預設 `8,8,8,8`、Cascadia Mono 12pt、opacity/acrylic/Mica）。
- Electron / React：僅作架構參照，未用於視覺決策。

> 備註：本報告的 hex 值是「建議值」，不是從單一專案複製；它們是根據上述專案的 token 邏輯（VS Code 的中性灰層次、shadcn 的 oklch 合約、n8n 的狀態四件套）重新調配。Designer 可在不改結構的前提下微調 hue，但請保持「中性 surface + 單一 accent + 半透明邊框」三個原則。
