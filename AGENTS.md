# AGENTS.md

OTP 專案的代理工作規範。所有在本 repo 工作的 agent 必須遵守以下規則。

## 常規設計規則（最高優先級）

**所有設計工作——不限 GUI、Desktop、設計類——都必須先參照 GitHub 100K+ stars 專案進行綜合構想，再動手。**

- 範圍：GUI/桌面介面、排版、色彩、icon、動效、空狀態，也涵蓋 CLI 輸出、文件格式、文件結構、README 風格等一切「設計」決策。
- 流程：
  1. 先用 web 查證候選專案的**現行** star 數（只收 100K+，不靠記憶）。
  2. 研究其 layout / typography / color / spacing / iconography / motion / empty state 等 pattern。
  3. 產出研究報告存 `docs/design/`，再進入設計與實作。
- 過去報告可重複引用，但 star 數須以查證當下為準。

## Git 署名

- 此 repo 的 commits 一律使用 OTP 署名（repo-local 已設 `user.name=OTP`、`user.email=58968500+azusakawa@users.noreply.github.com`）。
- 不要用其他身份（如 cheng）提交；歷史 commits 不改寫。
- push 驗證以 `git ls-remote origin master` 為準（PowerShell 上 push 可能報 NativeCommandError，非失敗）。

## 命名慣例

- 用戶端文字（README、UI）一律寫 **OTP**（大寫）。
- npm 套件名 `@otp/*`、CLI 指令 `otp`、資料目錄 `~/.otp/`、`window.otp` 維持小寫。
- 回覆與文件以中文為主。

## 技術紀律

- GUI 是純 Electron 視窗（`file://` 載入 `dist/`），不用 dev server / DevTools；`pnpm build` 後 `electron .` 驗證。
- E2E 用 CDP driver（port 9333）：`C:\Users\k8802\AppData\Local\Temp\opencode\otp-cdp.js`。
- Core 合約（`core/src/agent/process.ts`、`core/src/stores.ts`）變動前先看檔頭決策註解。
