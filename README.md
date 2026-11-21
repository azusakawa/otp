<div align="center">

# OTP

**Octopus Task Planner — Parallel AI coding agent orchestrator for OpenCode & Hermes**

[![GitHub stars](https://img.shields.io/github/stars/azusakawa/otp?style=flat-square&label=Stars&color=orange)](https://github.com/azusakawa/otp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11%20x64-42a5f9?style=flat-square)]()

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/M2V52B10UW)

The lightweight, personal AI agent orchestrator.

[**Download**](#download) · [**Quick Start**](#quick-start) · [**Features**](#features) · [**Supported Agents**](#supported-agents) · [**License**](#license)

English | [**繁體中文**](./README.zh-TW.md)

</div>

---

## Download

**Windows 10 22H2+ / Windows 11 · x64** — OTP is a desktop app; install it or extract it, then launch. No terminal needed.

| Build | File | Notes |
|---|---|---|
| **Installer (recommended)** | `OTP-Setup-0.1.0-x64.exe` | Per-user install by default (no admin); the wizard lets you change the location or install for all users. Adds Start Menu / desktop shortcuts and an uninstaller entry. |
| **Portable** | `OTP-0.1.0-win-x64.zip` | No installation. Extract anywhere and run `OTP.exe`. No shortcuts, no registry entries; update by replacing the folder. |

Grab the latest files from the [Releases page](https://github.com/azusakawa/otp/releases/latest).

> **Unsigned build notice**
> OTP is not code-signed yet. Windows SmartScreen may show **"Windows protected your PC"** with publisher **"Unknown publisher"** — click **More info → Run anyway** to continue.

---

## Quick Start

**Prerequisite:** have one agent CLI installed and logged in — [OpenCode](https://opencode.ai) or [Hermes Agent](https://hermes-agent.nousresearch.com). OTP launches them; it doesn't bundle an AI engine.

1. **Install or extract** (see Download), then launch **OTP**.
2. Click **+ Task Tree** and pick a git repository.
3. Start a session — press **O** for OpenCode or **H** for Hermes. No repository? Press **O/H** to start an idea session without a project.
4. Type your first task and run it. Watch the agent work live in chat and terminal.

Your worktrees, sessions and history live in `~/.otp` — they survive reinstalls, and the uninstaller never touches them.

---

## Features

| Feature | Description |
|---|---|
| 🖥️ **Desktop GUI** | Three-panel layout (worktrees / chat / terminal), frameless window, light & dark themes |
| 🐙 **Multi-agent** | Supports OpenCode & Hermes Agent simultaneously |
| 🌲 **Parallel worktrees** | Each task gets its own isolated Git worktree |
| 💬 **Real-time chat** | Send messages to agents and get live responses |
| 📺 **Terminal output** | Stream agent stdout/stderr in real time |
| ⚙️ **Settings** | Theme (light / dark / system) and interface language (EN / 繁體中文) |

---

## Supported Agents

| Agent | Install | Status |
|---|---|---|
| [OpenCode](https://opencode.ai) | `curl -fsSL https://opencode.ai/install \| bash` · Windows: `powershell -c "irm https://opencode.ai/install.ps1 \| iex"` | ✅ Fully supported |
| [Hermes Agent](https://hermes-agent.nousresearch.com) | see the official site | ✅ Fully supported |

---

## License

[MIT](./LICENSE) © 2026 azusakawa
