# Contributing to OTP

First off, thank you for considering contributing! This project is a labor of love and we appreciate any help.

## Code of Conduct

Be respectful and constructive. We welcome contributors of all backgrounds and experience levels.

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 8
- **Git**

### Setup

```bash
# Fork and clone
git clone https://github.com/<your-username>/otp.git
cd otp
pnpm install
```

### Project Structure

```
otp/
├── core/    ← Shared library (types, stores, agent management)
├── cli/     ← CLI application (Commander)
└── gui/     ← Desktop app (Electron + React + Vite)
```

**Rule of thumb:** New shared logic goes in `core`. Only add files to `cli` or `gui` when they are specific to that package.

## Development Workflow

```bash
# Build all packages
pnpm build

# Type-check everything
pnpm typecheck

# Start GUI in development mode
pnpm dev:gui
```

## Making Changes

1. **Create a branch** from `master`:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes**. Follow these guidelines:
   - **TypeScript** — strict mode enabled, no `any` without justification
   - **Naming** — keep project name as `OTP` (uppercase) in all user-facing text
   - **Package names** — npm scope is `@otp/*` (lowercase, as required)
   - **Chinese UI text** — use Traditional Chinese (繁體中文) for UI labels
   - **English docs** — README.md is the primary; translate to README.zh-CN.md

3. **Build and verify** before committing:
   ```bash
   pnpm build
   pnpm typecheck
   ```

4. **Commit with clear messages**:
   - `feat:` — new feature
   - `fix:` — bug fix
   - `docs:` — documentation only
   - `refactor:` — code restructure (no behavior change)
   - `chore:` — tooling, deps, config

5. **Push and open a PR**:
   ```bash
   git push -u origin feature/my-feature
   ```

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

## PR Checklist

- [ ] `pnpm build` passes
- [ ] `pnpm typecheck` passes
- [ ] Changes are self-contained (one feature per PR)
- [ ] User-facing text uses `OTP` (uppercase)
- [ ] New files have appropriate headers/comments

## Questions?

Open an issue or join the discussion. We'll respond as quickly as possible.
