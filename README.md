# Dev Explorer

> A desktop project explorer for developers — a smarter alternative to File Explorer for managing and launching local coding projects.

**Status:** Early development. MVP in progress.

<!-- TODO: screenshot once UI is built -->

## What is this?

Dev Explorer is a desktop app for organizing, browsing, and opening your local coding projects. Instead of treating every folder the same, it understands what a project is, surfaces the metadata you actually care about (where it lives, what language, when you last touched it), and makes the common next action — _open this thing in the right tool_ — a single click.

It takes inspiration from File Explorer (spatial sense of where your stuff lives), GitHub Desktop / GitKraken / SourceTree (your repos at a glance), and Raycast-style launchers (open in X muscle memory).

Dev Explorer is a personal project, built primarily for the author's own use, and shipped as a real desktop app via [Tauri](https://tauri.app).

## Features

### MVP (in progress)

- **Scan-based discovery** — point the app at one or more parent folders ("scan roots") and it indexes the projects inside, using `.git` and recognized manifest files (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, `*.sln`, ...) to identify projects
- **Manual add** — register any folder as a project, scan-root or not
- **Project list** — searchable, filterable table of all your projects with name, path, language, last-modified
- **Open in external app** — one click to open a project in VS Code, Windows Terminal, File Explorer, etc.
- **Configurable launchers** — add your own (Cursor, WebStorm, Warp, ...) using simple `code "{path}"`-style command templates

### Roadmap

**Phase 2 (post-MVP):**

- Read-only git status on project rows (branch, ahead/behind, dirty)
- File-system watcher for live index updates
- Tags, favorites, pinning
- Recent projects

**Phase 3 (aspirational):**

- Full git operations (stage / commit / push / pull / branch / diff) — GitKraken-lite
- Per-project notes
- Cross-machine sync of project metadata

See [`docs/PRD.md`](./docs/PRD.md) for the full product spec.

## Tech stack

- **Vite + React 19 + TypeScript** — frontend
- **TanStack Router** — file-based routing
- **shadcn/ui + Tailwind v4** — UI primitives and styling
- **TanStack Query + Zustand** — data fetching and local state
- **Tauri 2** — desktop shell (Rust backend) — _to be scaffolded_
- **Vitest** (browser mode via Playwright) — tests

## Getting started

Prerequisites: [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/).

```sh
pnpm install
pnpm dev
```

Once Tauri is wired up, the desktop dev workflow will be `pnpm tauri dev` (and you'll need a Rust toolchain via [rustup](https://rustup.rs/)).

### Other useful scripts

```sh
pnpm build           # type-check + Vite build
pnpm lint            # ESLint
pnpm format          # Prettier (also reorders imports)
pnpm knip            # find unused exports / deps
pnpm test            # Vitest, headless Chromium
```

First-time test setup requires a one-off Playwright install:

```sh
pnpm test:browser:install
```

## Repository layout

```
src/
  routes/         # TanStack Router file-based routes
  features/       # feature folders (page composition + components)
  components/
    ui/           # shadcn primitives (with local patches — see CLAUDE.md)
    data-table/   # data-table primitives, reused by the project list
    layout/       # app shell (sidebar, header)
  hooks/          # shared hooks
  lib/            # utilities
  stores/         # Zustand stores
  styles/         # Tailwind entry
docs/
  PRD.md          # product spec
```

## Contributing

This is a personal project — there's no formal contribution process. If you're working on it with an AI assistant, the conventions and architectural notes live in [`CLAUDE.md`](./CLAUDE.md).

## Credits

Bootstrapped from the excellent [Shadcn Admin Dashboard](https://github.com/satnaing/shadcn-admin) template by [@satnaing](https://github.com/satnaing). The original template's README is preserved as [`README-original.md`](./README-original.md).

## License

TBD.
