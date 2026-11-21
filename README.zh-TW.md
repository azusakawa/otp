<div align="center">

# OTP

**Octopus Task Planner — 輕量級 AI 智能體編排器，支援 OpenCode & Hermes**

[![GitHub stars](https://img.shields.io/github/stars/azusakawa/otp?style=flat-square&label=Stars&color=orange)](https://github.com/azusakawa/otp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat-square)]()
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-42a5f9?style=flat-square)]()
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square)](https://nodejs.org)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/M2V52B10UW)

輕量級個人 AI 智能體編排器。

[**快速開始**](#快速開始) · [**功能**](#功能) · [**CLI 參考**](#cli-參考) · [**架構**](#架構) · [**貢獻指南**](#貢獻指南)

**[English](./README.md) | 中文**

</div>

---

## 快速開始

三個指令即可啟動：

```bash
# 克隆 & 安裝
git clone https://github.com/azusakawa/otp.git
cd otp
pnpm install

# 啟動 GUI
pnpm dev:gui
```

開啟後即可看到三欄佈局：**工作樹**、**聊天**、**終端**。

---

## 功能

| 功能 | 說明 |
|---|---|
| 🖥️ **桌面 GUI** | 三欄佈局（工作樹 / 聊天 / 終端），可調整分割視窗 |
| 💻 **CLI** | 完整命令列介面 —— 智能體也能呼叫 |
| 🐙 **多智能體** | 同時支援 OpenCode & Hermes Agent |
| 🌲 **平行工作樹** | 每個任務擁有獨立的 Git worktree |
| 💬 **即時聊天** | 向智能體發送訊息，即時接收回應 |
| 📺 **終端輸出** | 即時串流顯示智能體 stdout/stderr |

---

## CLI 參考

```bash
otp worktree <name> -r <repo-path>      # 建立工作樹
otp worktree:ls                          # 列出工作樹
otp worktree:rm <id>                     # 刪除工作樹

otp session:create -w <wt-id> -a <type>  # 建立會話（opencode / hermes）
otp session:start <id>                   # 啟動智能體
otp session:stop <id>                    # 停止智能體
otp session:ls                           # 列出會話
```

---

## 架構

```
otp/
├── core/                     # 共享核心庫
│   ├── src/
│   │   ├── types/           # TypeScript 類型與 Zod schema
│   │   ├── stores.ts        # 持久化會話/工作樹存儲
│   │   ├── agent.ts         # 智能體進程管理
│   │   └── helpers/         # 工具函數
│   └── package.json
│
├── cli/                      # 命令行介面
│   ├── src/index.ts         # Commander CLI
│   └── package.json
│
└── gui/                      # 桌面應用（Electron + React）
    ├── electron/main/       # Electron 主進程 + IPC
    ├── src/                 # React UI 組件
    │   ├── App.tsx          # 三欄佈局
    │   ├── styles.css       # GitHub 深色主題
    │   └── index.tsx        # 入口檔案
    └── package.json
```

`core` 是唯一的真實來源 —— `cli` 和 `gui` 都依賴它，確保類型、存儲和智能體邏輯一致。

---

## 支援的智能體

| 智能體 | CLI 指令 | 狀態 |
|---|---|---|
| [OpenCode](https://opencode.ai) | `opencode` | ✅ 完整支援 |
| [Hermes Agent](https://hermes-agent.nousresearch.com) | `hermes` | ✅ 完整支援 |

可以在 `core/src/types/` 中擴充更多智能體類型。

---

## 技術棧

- **語言：** TypeScript 5.x（嚴格模式）
- **建構：** pnpm workspaces
- **GUI：** Electron 33 + React 18 + Vite
- **CLI：** Commander
- **Schema 驗證：** Zod
- **存儲：** JSON 檔案（會話、工作樹）

---

## 貢獻指南

歡迎貢獻！請閱讀 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解更多。

快速指南：

```bash
# 1. Fork & 克隆
git clone https://github.com/<your-username>/otp.git
cd otp
pnpm install

# 2. 建立分支
git checkout -b feature/my-feature

# 3. 建構 & 驗證
pnpm build        # 建構所有套件
pnpm typecheck    # 檢查所有類型

# 4. 提交 PR
git push -u origin feature/my-feature
```

---

## License

[MIT](./LICENSE) © 2026 azusakawa
