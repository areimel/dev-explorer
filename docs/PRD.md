# Dev Explorer — Product Requirements

> **Status:** MVP in progress. This document is the product spec; see `CLAUDE.md` for engineering conventions and `README.md` for a high-level overview.

## Vision

Dev Explorer is a **desktop app for organizing, browsing, and launching local coding projects**. It's positioned as a developer-focused alternative to File Explorer / Finder: instead of treating every folder the same, it understands what a "project" is, surfaces the metadata a developer cares about, and makes the common next action (open this thing in the right tool) one click away.

Inspirations:

- **GitHub Desktop / GitKraken / SourceTree** — for the "your repos at a glance" feel and (eventually) git affordances
- **File Explorer** — for the spatial sense of "where my stuff lives"
- **Raycast / Alfred launchers** — for the "open this in X" muscle memory

This is a **desktop application**, shipped via Tauri. It is not a web app and does not run in the cloud.

## Target user

Initially a single user (the author): a solo developer working across many small-to-medium projects on Windows, who wants a faster, more informative way to find a project and open it in the right tool than tabbing through File Explorer or VS Code's "Recent" list.

Designed Windows-first but built on Tauri so cross-platform support is realistic later.

## Core concepts

- **Project** — a folder on disk that the user considers a coding project. Detected by heuristics (`.git` directory, recognized manifest like `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `*.sln`) or added manually.
- **Scan Root** — a parent directory the user has registered with the app (e.g. `C:\Users\Alec\Dev\personal`). The app indexes projects underneath it.
- **Launcher** — a named, configurable command for opening a project in an external app (e.g. "Open in VS Code", "Open in Terminal"). Defined by a command template like `code "{path}"`.
- **Tag** _(Phase 2)_ — user-applied labels for organizing projects across scan roots.

## MVP feature set

The MVP delivers the **smallest useful version**: discover projects, see them in one place, and open them in the right tool.

### 1. Project discovery — scan + manual add

- Users configure one or more **scan roots** in settings.
- The app walks each scan root (bounded depth, skipping `node_modules`, `.git`, `target`, `dist`, `build`, etc.) and indexes folders that look like projects.
- Detection heuristics (a folder qualifies as a project if **any** match):
  - Contains a `.git` directory
  - Contains a recognized manifest: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `*.sln`, `*.csproj`, `Gemfile`, `composer.json`
- Users can also **manually add** any folder as a project, even outside scan roots.
- Each project is stored with: id, absolute path, display name (derived from folder name, editable), source (`scanned` vs `manual`), scan-root id (if applicable), detected language/framework, last-modified time.
- Re-scan is **on-demand** in MVP (a button in settings or the project list). File-system watching is Phase 2.

### 2. Project list view

- Data-table-style page listing all known projects, reusing the template's `src/components/data-table/` primitives (toolbar, pagination, faceted filter, column header).
- Columns: name, path, language/framework, last-modified, source.
- Search box (fuzzy match over name + path).
- Faceted filters: language, scan root, source.
- Row click → project detail panel (or detail route — TBD during implementation).

### 3. Project detail

- Shows: full path, detected manifests, README preview if `README.md` exists at the root.
- Action buttons for each configured launcher.
- Edit display name, remove project, "reveal in scan root".

### 4. Launchers (open in external app)

- Configurable list of launcher entries, stored in app settings. Each entry has:
  - **Name** (e.g. "VS Code")
  - **Icon** (lucide icon picker; default fallback)
  - **Command template** with `{path}` placeholder (e.g. `code "{path}"`, `wt -d "{path}"`)
- Defaults shipped on first run: VS Code (`code "{path}"`), PowerShell (`wt -d "{path}"` falling back to `powershell -NoExit -Command "Set-Location -Path '{path}'"`), File Explorer (`explorer "{path}"`).
- User can add, remove, reorder, and edit launchers in settings.
- Launcher execution goes through a Tauri command; the frontend never spawns shells directly.

### 5. Settings

- Reuses the template's `_authenticated/settings/` shell layout (stripped of auth gating).
- Sections:
  - **Scan roots** — add / remove / re-scan
  - **Launchers** — CRUD + reorder
  - **Appearance** — theme (kept from template)

## Phase 2 — post-MVP

Listed for direction, not committed:

- **Read-only git status on project rows** — current branch, ahead/behind counts, dirty flag, last commit message
- **File-system watcher** — auto-refresh the index when projects appear/disappear in scan roots
- **Tags / favorites / pinning** — multi-axis organization
- **Recent projects** — fast-access list at the top of the project view
- **Bulk actions** — multi-select for tagging or removal

## Phase 3 — aspirational

- **Full git operations** — stage / commit / push / pull / branch / diff inside the app (GitKraken-lite)
- **Per-project notes / TODOs** — markdown notes attached to a project
- **Cross-machine sync** — optional sync of project metadata (NOT the projects themselves) across machines

## Non-goals

- Not a code editor — Dev Explorer launches editors, it doesn't replace them
- Not a full git GUI in MVP (Phase 3 only, and even there it stays opinionated/lightweight)
- Not a cloud service — no accounts, no server backend in MVP
- Not a generic file manager — it understands "projects", not arbitrary folders

## Architecture overview

- **Frontend:** existing Vite + React 19 + TanStack Router + shadcn/ui + Tailwind v4 stack
- **Desktop shell:** Tauri 2 (Rust backend), set up upfront in the next implementation round. Exposes commands roughly like:
  - `scan_root(root_path) → Project[]`
  - `add_manual_project(path) → Project`
  - `read_project_metadata(path) → { manifests, readme, ... }`
  - `open_with_launcher(project_path, launcher_template)`
- **Persistence:** local app data, managed through Tauri. Stores scan roots, launcher configs, manual projects, project overrides (renames), and (Phase 2) tags. JSON-vs-SQLite decision deferred to the architecture round.
- **Auth:** none. The existing Clerk demo and Zustand auth store are template legacy and will be removed in the cleanup round.

## Cleanup expected before MVP build

The following are template artifacts to be removed when MVP work begins:

- Sample feature folders: `tasks`, `users`, `apps`, `chats`, `help-center`
- Clerk integration (`src/routes/clerk/`, `@clerk/react` dependency, related env vars)
- Auth flow: `(auth)` route group, `_authenticated` gating, `src/stores/auth-store.ts`, cookie helpers, sign-in/sign-up/OTP/forgot-password screens, axios 401 interceptor

What to **keep**:

- `src/components/ui/` — shadcn primitives (with their RTL/local patches noted in CLAUDE.md)
- `src/components/data-table/` — directly reused for the project list
- `src/components/layout/` — sidebar/header shell
- Settings shell (`_authenticated/settings/`) — repurposed
- Theme, Font, Direction providers
- All tooling: Vite, ESLint, Prettier, Knip, Vitest browser mode, TanStack Router file-based routing

## Open questions (decisions to make)

These are not blockers for kickoff but should be settled before or during implementation:

1. **Storage backend** — JSON file (simple, diff-friendly, fine for hundreds of projects) vs SQLite (faster queries, better at scale, more setup). Lean: JSON for MVP, revisit if scale demands.
2. **Cross-platform priority** — Windows-only first, or Win + macOS from day one? Affects launcher defaults and Tauri config.
3. **RTL support** — the template ships RTL providers. Worth keeping for a personal Windows-first dev tool, or strip for simplicity?
4. **Project identity stability** — if a project moves on disk, is it the same project (by id) or a new one? Affects how we handle renames/moves in Phase 2.
5. **Launcher security model** — command templates are powerful and dangerous. Should we restrict to known-safe templates, sanitize aggressively, or trust the user (since it's a single-user local app)?

## Success criteria for MVP

The MVP is "done" when, on the author's machine:

1. Pointing the app at `C:\Users\Alec\Dev\personal` produces a usable list of projects within a few seconds
2. Clicking a project and clicking "Open in VS Code" opens VS Code at that folder
3. Clicking "Open in Terminal" opens Windows Terminal in that folder
4. A new project added to the scan root shows up after a manual re-scan
5. The author prefers using Dev Explorer over File Explorer for the "find a project, open it in VS Code" flow
