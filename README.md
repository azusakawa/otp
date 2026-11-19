# OTP (Octopus Task Planner)

章魚式 AI 智能體編排器 — 像章魚一樣同時支撐多個面向：GUI 桌面、CLI 命令行、多智能體協作、平行工作樹、即時聊天、終端輸出。

## 為什麼叫 OTP？

**O**ctopus **T**ask **P**lanner — 像章魚多隻觸手同時工作，OTP 能同時管理多個 AI 智能體，讓它們在各個工作樹中平行協作。

## 功能

- 🖥️ **GUI 桌面** — 三欄佈局（工作樹 / 聊天 / 終端），拖移管理
- 💻 **CLI** — 完整命令列，智能體也能調用
- 🐙 **多智能體** — OpenCode + Hermes Agent 雙支援
- 🌲 **平行工作樹** — 每個任務樹獨立 Git worktree
- 💬 **即時聊天** — 直接與智能體對話
- 📺 **終端輸出** — 實時追蹤智能體執行

## 快速開始

```bash
cd OTP
pnpm install
pnpm dev:gui          # 啟動 GUI
```

## CLI

```bash
otp worktree "新功能" -r ~/projects/my-repo
otp session:create -w <wt-id> -a opencode    # 或 -a hermes
otp session:start <session-id>
otp session:ls
```

## 支援的智能體

| 智能體 | CLI | GUI 標識 |
|---|---|---|
| OpenCode | `opencode` | 🔵 |
| Hermes Agent | `hermes` | 🟣 |

## 架構

```
otp/
├── core/   ← 共享核心 (stores, agent, types)
├── cli/    ← CLI (commander)
└── gui/    ← GUI (Electron + React)
```

## 與 Orca 的關係

OTP 靈感來自 [stablyai/orca](https://github.com/stablyai/orca)，但專注於：
- 只支援 OpenCode + Hermes
- 更輕量，同時提供 CLI + GUI
- 個人使用優先
