<div align="center">

# OTP

**Octopus Task Planner — Parallel AI coding agent orchestrator for OpenCode & Hermes**

[![GitHub stars](https://img.shields.io/github/stars/azusakawa/otp?style=flat-square&label=Stars&color=orange)](https://github.com/azusakawa/otp/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat-square)]()
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-42a5f9?style=flat-square)]()
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen?style=flat-square)](https://nodejs.org)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/M2V52B10UW)

The lightweight, personal AI agent orchestrator.

[**Download**](#download) · [**Features**](#features) · [**CLI**](#cli-reference) · [**Architecture**](#architecture) · [**Contributing**](#contributing)

</div>

---

## Download

**Windows 10 22H2+ / Windows 11 · x64** — OTP is a desktop app; install it or extract it, then launch `OTP.exe`. No terminal needed.

| Build | File | Notes |
|---|---|---|
| **Installer (recommended)** | `OTP-Setup-0.1.0-x64.exe` | Installs for the current user by default (no admin); choose "All users" in the wizard for a machine-wide install. Adds Start Menu / desktop shortcuts and an uninstaller. |
| **Portable** | `OTP-0.1.0-win-x64.zip` | No installation. Extract anywhere and run `OTP.exe`. No shortcuts, no registry entries; update by replacing the folder. |
| Checksums | `SHA256SUMS.txt` | Verify your download before running. |

Grab the latest files from the [Releases page](https://github.com/azusakawa/otp/releases/latest).

> **Unsigned build notice**
> OTP is not code-signed yet. Windows SmartScreen may show **"Windows protected your PC"** with publisher **"Unknown publisher"** — click **More info → Run anyway** to continue.
> To verify first, compare the file's SHA-256 with `SHA256SUMS.txt` in the same release.

---

## Quick Start

Get up and running in three commands:

```bash
# Clone & install
git clone https://github.com/azusakawa/otp.git
cd otp
pnpm install

# Start the GUI
pnpm dev:gui
```

That's it. A desktop app opens with a three-panel layout: **worktrees**, **chat**, and **terminal**.

---

## Features

| Feature | Description |
|---|---|
| 🖥️ **Desktop GUI** | Three-panel layout (worktrees / chat / terminal), resizable split panes |
| 💻 **CLI** | Full command-line interface — agents can invoke it too |
| 🐙 **Multi-agent** | Supports OpenCode & Hermes Agent simultaneously |
| 🌲 **Parallel worktrees** | Each task gets its own isolated Git worktree |
| 💬 **Real-time chat** | Send messages to agents and get live responses |
| 📺 **Terminal output** | Stream agent stdout/stderr in real time |

---

## CLI Reference

```bash
otp worktree <name> -r <repo-path>      # Create a worktree
otp worktree:ls                          # List worktrees
otp worktree:rm <id>                     # Remove a worktree

otp session:create -w <wt-id> -a <type>  # Create a session (opencode / hermes)
otp session:start <id>                   # Start agent in session
otp session:stop <id>                    # Stop agent
otp session:ls                           # List sessions
```

---

## Architecture

```
otp/
├── core/                     # Shared library
│   ├── src/
│   │   ├── types/           # TypeScript types & Zod schemas
│   │   ├── stores.ts        # Persistent session/worktree storage
│   │   ├── agent.ts         # Agent process management
│   │   └── helpers/         # Utilities
│   └── package.json
│
├── cli/                      # Command-line interface
│   ├── src/index.ts         # Commander-based CLI
│   └── package.json
│
└── gui/                      # Desktop application (Electron + React)
    ├── electron/main/       # Electron main process + IPC
    ├── src/                 # React UI components
    │   ├── App.tsx          # Three-panel layout
    │   ├── styles.css       # GitHub-dark theme
    │   └── index.tsx        # Entry point
    └── package.json
```

The `core` package is the single source of truth — both `cli` and `gui` depend on it. This keeps types, stores, and agent logic in sync.

---

## Supported Agents

| Agent | CLI Binary | Status |
|---|---|---|
| [OpenCode](https://opencode.ai) | `opencode` | ✅ Fully supported |
| [Hermes Agent](https://hermes-agent.nousresearch.com) | `hermes` | ✅ Fully supported |

More agents can be added by extending the type definitions in `core/src/types/`.

---

## Tech Stack

- **Language:** TypeScript 5.x (strict mode)
- **Build:** pnpm workspaces
- **GUI:** Electron 33 + React 18 + Vite
- **CLI:** Commander
- **Schema validation:** Zod
- **Storage:** JSON file-based (sessions, worktrees)

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

Quick guide:

```bash
# 1. Fork & clone
git clone https://github.com/<your-username>/otp.git
cd otp
pnpm install

# 2. Create a branch
git checkout -b feature/my-feature

# 3. Build & verify
pnpm build        # Build all packages
pnpm typecheck    # Type-check all packages

# 4. Submit a PR
git push -u origin feature/my-feature
```

---

## License

[MIT](./LICENSE) © 2026 azusakawa
