<div align="center">

# OTP

**Octopus Task Planner — 平行 AI 編碼智能體編排器，支援 OpenCode & Hermes**

[![GitHub stars](https://img.shields.io/github/stars/azusakawa/otp?style=flat-square&label=Stars&color=orange)](https://github.com/azusakawa/otp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11%20x64-42a5f9?style=flat-square)]()

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/M2V52B10UW)

輕量級的個人 AI 智能體編排器。

[**下載**](#下載) · [**快速開始**](#快速開始) · [**功能**](#功能) · [**支援的智能體**](#支援的智能體) · [**授權條款**](#授權條款)

[**English**](./README.md) | 繁體中文

</div>

---

## 下載

**Windows 10 22H2+ / Windows 11 · x64** — OTP 是桌面應用程式：安裝或解壓後直接啟動，不需要命令提示字元。

| 版本 | 檔案 | 說明 |
|---|---|---|
| **安裝版（建議）** | `OTP-Setup-0.1.0-x64.exe` | 預設為使用者層級安裝（不需管理員權限）；精靈可改安裝位置或安裝給所有使用者。會加入開始功能表／桌面捷徑與解除安裝項目。 |
| **免安裝版** | `OTP-0.1.0-win-x64.zip` | 不需安裝。解壓到任何位置後執行 `OTP.exe`。不建捷徑、不寫登錄；更新時直接替換整個資料夾即可。 |

最新檔案請到 [Releases 頁面](https://github.com/azusakawa/otp/releases/latest) 取得。

> **未簽名版本提醒**
> OTP 目前尚未程式碼簽章。Windows SmartScreen 可能顯示「Windows 已保護你的電腦」，且發行商為「不明」——點選 **更多資訊 → 仍要執行** 即可繼續。

---

## 快速開始

**前置需求**：本機已安裝並登入其中一個智能體 CLI——[OpenCode](https://opencode.ai) 或 [Hermes Agent](https://hermes-agent.nousresearch.com)。OTP 負責啟動它們，本身不附帶 AI 引擎。

1. **安裝或解壓**（見「下載」），然後啟動 **OTP**。
2. 點選 **＋ 任務樹**，選擇一個 git 倉庫。
3. 建立工作階段——按 **O** 使用 OpenCode，或按 **H** 使用 Hermes。沒有倉庫？直接按 **O/H** 即可建立不附專案的構想工作階段。
4. 輸入第一個任務並執行。在聊天與終端中即時觀看智能體工作。

你的 worktree、工作階段與歷史都存放在 `~/.otp`——重裝後仍保留，解除安裝程式也不會動到它們。

---

## 功能

| 功能 | 說明 |
|---|---|
| 🖥️ **桌面 GUI** | 三欄佈局（任務樹／聊天／終端）、無框視窗、淺色與深色主題 |
| 🐙 **多智能體** | 同時支援 OpenCode 與 Hermes Agent |
| 🌲 **平行 worktree** | 每個任務擁有獨立的 Git worktree |
| 💬 **即時聊天** | 發送訊息給智能體並即時取得回覆 |
| 📺 **終端輸出** | 即時串流智能體的 stdout/stderr |
| ⚙️ **設定** | 主題（淺色／深色／跟隨系統）與介面語言（EN／繁體中文） |

---

## 支援的智能體

| 智能體 | 安裝 | 狀態 |
|---|---|---|
| [OpenCode](https://opencode.ai) | `curl -fsSL https://opencode.ai/install \| bash` · Windows: `powershell -c "irm https://opencode.ai/install.ps1 \| iex"` | ✅ 完整支援 |
| [Hermes Agent](https://hermes-agent.nousresearch.com) | 見官方網站 | ✅ 完整支援 |

---

## 授權條款

[MIT](./LICENSE) © 2026 azusakawa
