# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Project status

**Dev Explorer** — a Tauri desktop app for managing and exploring local coding projects. A developer-focused alternative to File Explorer, with affordances borrowed from GitHub Desktop / GitKraken / SourceTree.

**MVP in progress.** See `docs/PRD.md` for the product spec.

The codebase was forked from the **Shadcn Admin Dashboard** template (Vite + React 19 + TanStack Router + shadcn/ui + Tailwind v4). Substantial portions of that template are still present and slated for removal as MVP work proceeds — see "Template legacy" below.

## Architecture / product shape

- **Frontend:** Vite + React 19 + TypeScript SPA, TanStack Router (file-based), shadcn/ui, Tailwind v4. Path alias `@` → `src`.
- **Desktop shell:** Tauri 2 (Rust backend). **Not yet scaffolded** — adding Tauri is the next major work item. Once added, FS access, shell launching, and (Phase 2) git ops will live behind Tauri commands; the frontend never spawns shells directly.
- **Discovery model:** users register one or more **scan roots** (parent directories like `C:\Users\Alec\Dev\personal`); the app indexes projects under each root using heuristics (`.git`, recognized manifest files). Manual "Add project" is also supported for folders outside scan roots.
- **Launchers:** "Open in VS Code / Terminal / File Explorer / ..." are user-configurable command templates with a `{path}` placeholder, executed via Tauri.
- **No auth.** Dev Explorer is a single-user local desktop app. The template's auth flow and Clerk demo are legacy and being removed.
- **Persistence:** local app data via Tauri (JSON-vs-SQLite TBD). Stores scan roots, launcher config, manual projects, project overrides.

## Commands

Package manager is **pnpm**.

- `pnpm dev` — Vite dev server (browser-only; once Tauri is wired up, prefer `pnpm tauri dev`)
- `pnpm build` — `tsc -b && vite build` (type errors fail the build)
- `pnpm lint` — ESLint over the repo
- `pnpm format` / `pnpm format:check` — Prettier (also reorders imports per `.prettierrc` `importOrder`)
- `pnpm knip` — dead code / unused deps
- `pnpm test` — Vitest in headless Chromium (browser mode)
- `pnpm test:browser` — same, headed (useful for debugging)
- `pnpm test:browser:install` — **must be run once** before tests work; installs the Playwright Chromium binary
- Single test file: `pnpm vitest run src/path/to/foo.test.ts` (add `-t "name"` to filter by test name)

Tauri commands (e.g. `pnpm tauri dev`, `pnpm tauri build`) will be added when the Rust shell is scaffolded. A working Rust toolchain (rustup + stable) will be a prerequisite at that point.

## Routing (TanStack Router, file-based)

- Routes live in `src/routes/`. `@tanstack/router-plugin/vite` generates `src/routeTree.gen.ts` automatically — **never edit it manually**; it regenerates on dev/build.
- **Current route groups (mostly template legacy):**
  - `(auth)` — sign-in, sign-up, OTP, forgot-password — **slated for removal**
  - `_authenticated/` — protected layout shell — **shell will be repurposed**, gating will be removed
  - `(errors)` — error pages — **keep**
  - `clerk/` — Clerk demo — **slated for removal**
- **Target product routes** (TBD during cleanup): a flat structure with `projects/` (list + detail), `settings/` (scan roots, launchers, appearance). The sidebar/header layout from `_authenticated/` will be reused as the app shell, minus the auth gate.
- The router instance is created in `src/main.tsx` with a `queryClient` in context. Type-safe routing relies on the `declare module '@tanstack/react-router'` block there.

## State and data flow

- A single `QueryClient` is configured in `src/main.tsx`. Its current 401-redirect / auth-reset behavior is **template legacy** and will be simplified once auth is removed.
- Local app state will live in Zustand stores backed by Tauri-persisted JSON/SQLite. The existing `src/stores/auth-store.ts` is legacy and will be removed.
- Provider order in `src/main.tsx`: `QueryClientProvider` → `ThemeProvider` → `FontProvider` → `DirectionProvider` → `RouterProvider`. Theme + Font providers stay; whether to keep `DirectionProvider` (RTL) is an open question (see PRD).

## Features

`src/features/<name>/` is the standard feature folder shape:

- `index.tsx` — page composition (Header, Main, dialogs, providers)
- `components/` — feature-local components, often including a `<Feature>Provider` for dialog/selection state and a `<Feature>Table` for data-table screens
- `data/` — sample/mock data

**Existing features (`tasks`, `users`, `apps`, `chats`, `help-center`) are template demos and will be removed.** The product features will be:

- `projects/` — the project list (data-table) and detail panel; the primary surface of the app
- `settings/` — scan roots, launchers, appearance

The data-table primitives in `src/components/data-table/` (toolbar, pagination, column-header, faceted-filter, bulk-actions) are explicitly intended for reuse by the project list. URL state for tables uses the `useTableUrlState` hook (`src/hooks/use-table-url-state.ts`).

## Components

- `src/components/ui/` — shadcn/ui primitives. **Ignored by ESLint and Knip** and excluded from coverage. Several components have local modifications:
  - **Modified**: `scroll-area`, `sonner`, `separator`
  - **RTL-patched**: `alert-dialog`, `calendar`, `command`, `dialog`, `dropdown-menu`, `select`, `table`, `sheet`, `sidebar`, `switch`
  - Re-running `npx shadcn@latest add <component>` will overwrite these patches. For the components above, merge updates manually.
- `src/components/layout/` — app shell (sidebar, header, top-nav, team-switcher). Sidebar contents come from `src/components/layout/data/sidebar-data.ts` and will be rewritten to reflect Dev Explorer's nav.
- `src/components/` (root level) — cross-feature components (search, command-menu, profile-dropdown, theme-switch, config-drawer, etc.). `profile-dropdown` becomes irrelevant once auth is removed; the others stay.

## Styling

Tailwind v4 via `@tailwindcss/vite`. Single stylesheet entry at `src/styles/index.css`. The `cn` / `clsx` helpers are configured as Tailwind class functions in `.prettierrc` so class strings inside them get sorted automatically.

## Conventions enforced by tooling

- **No `console.*`** — `no-console` is `error` (a single `eslint-disable-next-line` is used in `main.tsx` for a DEV-only log; prefer not to add more).
- **Type-only imports** — `@typescript-eslint/consistent-type-imports` is `error` with `fixStyle: 'inline-type-imports'`. Use `import { type Foo }` or `import type { Foo }`; ESLint will autofix violations.
- **No duplicate imports** from the same module.
- **Unused vars** must be prefixed with `_` to be allowed.
- **Import order** is enforced by `@trivago/prettier-plugin-sort-imports`. Running `pnpm format` will reshuffle imports — don't fight it; if you need a specific group, see `importOrder` in `.prettierrc`.
- Prettier: no semicolons, single quotes (incl. JSX), 2-space indent, 80 col, `trailingComma: es5`.

## Testing

Vitest runs in **browser mode** (Chromium via `@vitest/browser-playwright`) — there is no jsdom config. Tests are colocated next to source as `*.test.ts(x)`. Coverage excludes `src/components/ui/**`, `src/routes/**`, `src/test-utils/**`, generated files, and assets.

If browser tests fail to launch with a Playwright/Chromium error on a fresh checkout, run `pnpm test:browser:install` first.

Note: tests run in a real browser, but the product targets Tauri's webview. For Tauri-specific code paths (commands, FS access), prefer thin frontend wrappers that can be mocked at the boundary so tests stay browser-friendly.

## Tauri (planned)

When Tauri is scaffolded:

- Rust source will live in `src-tauri/` (default Tauri layout)
- `tauri.conf.json` controls window, bundle, and allowlist settings
- Tauri commands are the only path from frontend to OS-level operations (FS, shell). Treat the boundary like an API: typed wrappers in `src/lib/tauri/` will keep frontend code testable without a running Tauri runtime.
- A Rust toolchain (rustup, stable channel) becomes a development prerequisite

## Template legacy (to be removed)

The following are Shadcn Admin Dashboard template artifacts that don't belong in Dev Explorer. They are still present in the repo but should be removed as MVP work progresses:

- Sample features: `tasks`, `users`, `apps`, `chats`, `help-center` (under `src/features/` and `src/routes/_authenticated/`)
- Clerk integration: entire `src/routes/clerk/` directory, the `@clerk/react` dependency, related env vars, the `ClerkProvider` wiring
- Auth flow: `(auth)` route group (sign-in / sign-up / OTP / forgot-password), `_authenticated` gating, `src/stores/auth-store.ts`, cookie helpers (`src/lib/cookies.ts`), the 401 axios/Query interceptor in `src/main.tsx`
- `axios` dependency may also become unused once the auth/API layer is gone — verify with `pnpm knip`

When unsure whether a piece of code is "template" or "product": if removing it would only affect the demo features listed above, it's template legacy.

## Environment

- `.env` (gitignored): currently configures Clerk (`VITE_CLERK_PUBLISHABLE_KEY`); will be removed with the Clerk integration
- `netlify.toml` exists from the template (SPA fallback). **Dev Explorer is a desktop app; web hosting is not a deployment target.** This file may be removed once Tauri is wired up
- Future: `tauri.conf.json` will hold desktop app config (window, bundle, allowlist)
