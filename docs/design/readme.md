# README 結構研究（100K+ stars 參考）

日期：2026-11-21（star 數為當日查證值，見 `distribution.md`）

## 參考專案

| 專案 | Stars（2026-11-21） | README 取樣 |
|---|---|---|
| n8n | 211,561 | `n8n-io/n8n` README.md |
| Visual Studio Code | 195,691 | `microsoft/vscode` README.md |
| Ollama | 187,782 | `ollama/ollama` README.md |

## 共同 pattern（本次改寫採用）

1. **Download / 取得方式放在最前面**，且只列終端用戶選項（ollama：每平台一條指令或一個下載連結；n8n：install script + docker；vscode：導向下載頁）。
2. **Quick Start = 安裝後的首次使用步驟**（第一次見值價值），不是「clone + pnpm install」開發流程。
3. **不列校驗檔**（SHA-256 / checksums）——三家皆無。
4. **開發/技術細節（architecture、tech stack、build 流程）不進主 README**：ollama 完全沒有；vscode 的 README 雖是 dev-repo 定位，也只用 wiki 外链。
5. **Badge 只放真實可驗證的**（stars、license、issue 數）；ollama 零 badge，n8n 零 badge。
6. **License 收尾**；_contributing 若存在，只是一個指向 guide 的短段落_（OTP 本次決定整段移除）。
7. 版本號不寫死在 README 檔名（或僅作示例），一律導向 Releases 頁。

## OTP 應用決定（2026-11-21 用戶決策）

- Download 只留「安裝版（建議）/ 免安裝版」兩行；移除校驗檔行與 SHA-256 提法。
- Quick Start 改為 GUI 操作流程（啟動 → ＋任務樹 → O/H 工作階段 → 第一個任務）；前置需求一句話（opencode 或 hermes CLI）。
- 移除：CLI Reference、Contributing、Architecture、Tech Stack；`CONTRIBUTING.md` 檔案一併刪除。
- Badge：移除無 CI 背書的 build 徽章與 node 徽章（開發者向）；platform 徽章改為 Windows 10/11 x64（現狀只有 Windows 產物）。
- zh-TW 版全面改繁體（舊版全文為簡體）。
