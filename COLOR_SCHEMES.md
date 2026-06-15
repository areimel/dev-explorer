# Color Schemes

## Overview

Color scheme is **orthogonal to light/dark mode**. The two axes combine
independently:

- **Mode** (`light` / `dark`) is controlled by the `light` or `dark` class on
  `<html>` and persisted in the `vite-ui-theme` cookie.
- **Color scheme** is controlled by the `data-color-scheme` attribute on `<html>`
  and persisted in the `vite-ui-color-scheme` cookie.

The `default` scheme is the built-in shadcn/ui palette defined in
`src/styles/theme.css`. When `default` is selected the `data-color-scheme`
attribute is **removed** entirely, so the base token cascade applies unchanged.

The 14 additional schemes are sourced from the
[kepano/obsidian-minimal](https://github.com/kepano/obsidian-minimal) theme and
emitted into `src/styles/color-schemes.css` by the generator script.

---

## Source & Attribution

- **Upstream**: kepano/obsidian-minimal (master branch),
  `src/scss/color-schemes/*.scss`
- **License**: MIT
- Raw `.scss` sources are committed under `scripts/obsidian-schemes/` and are
  not modified by hand — they serve as the generator's input only.

---

## Scheme List

All 15 schemes (Default + 14 from Obsidian Minimal), with their representative
accent swatch hex per mode. Swatches are backfilled automatically by the
generator from each scheme's primary accent color.

| Value      | Label      | Light swatch | Dark swatch |
| ---------- | ---------- | ------------ | ----------- |
| `default`  | Default    | `#3b3b54`    | `#e5e7eb`   |
| `atom`     | Atom       | `#546be8`    | `#598cf3`   |
| `ayu`      | Ayu        | `#ff9900`    | `#e6b451`   |
| `catppuccin` | Catppuccin | `#dc8b79`  | `#f2d5cf`   |
| `dracula`  | Dracula    | `#bf95f9`    | `#bf95f9`   |
| `eink`     | E-ink      | `#000000`    | `#ffffff`   |
| `everforest` | Everforest | `#91b25c`  | `#aac181`   |
| `flexoki`  | Flexoki    | `#24847c`    | `#3baba2`   |
| `gruvbox`  | Gruvbox    | `#d85f0e`    | `#d85f0e`   |
| `macos`    | macOS      | `#0077ff`    | `#0077ff`   |
| `nord`     | Nord       | `#5d81ac`    | `#5d81ac`   |
| `rose-pine` | Rosé Pine | `#d7837e`    | `#ebbdbc`   |
| `sky`      | Sky        | `#2eaadc`    | `#2eaadc`   |
| `solarized` | Solarized | `#2589d0`    | `#2589d0`   |
| `things`   | Things     | `#1a60c1`    | `#5095f7`   |

---

## Architecture

### Selector convention

Non-default schemes are scoped with two selectors — one per mode:

```css
/* light mode */
[data-color-scheme='atom']:not(.dark) { ... }

/* dark mode */
[data-color-scheme='atom'].dark { ... }
```

The `default` scheme has no `data-color-scheme` selector; it relies on the base
`src/styles/theme.css` cascade.

### CSS files

| File | Role |
| ---- | ---- |
| `src/styles/theme.css` | Base (`default`) scheme — shadcn token definitions; hand-maintained |
| `src/styles/color-schemes.css` | **GENERATED** — all non-default schemes; do not hand-edit |

### Token indirection

Each scheme block overrides raw `--token` custom properties (e.g.
`--background`, `--primary`, etc.) using `@theme inline` indirection. This
means that overriding a single raw token cascades to every Tailwind utility that
references it — e.g. changing `--primary` automatically updates
`bg-primary`, `text-primary`, `border-primary`, etc.

---

## Token Mapping Table

The generator maps Obsidian Minimal SCSS variables to shadcn design tokens.
Entries marked `??` indicate a pragmatic fallback when the preferred source
variable is absent in a given scheme.

| Obsidian Minimal var | shadcn token(s) |
| -------------------- | --------------- |
| `bg1` | `--background`, `--card`, `--popover` |
| `tx1` | `--foreground`, `--card-foreground`, `--popover-foreground` |
| `bg2` | `--secondary`, `--muted`, `--accent`, `--sidebar` |
| `bg3` (?? `bg2`) | `--sidebar-accent` |
| `tx2` (?? `tx3`) | `--muted-foreground` |
| `tx1` | `--secondary-foreground`, `--accent-foreground`, `--sidebar-foreground`, `--sidebar-accent-foreground` |
| `ui1` | `--border`, `--sidebar-border` |
| `ui2` (?? `ui1`) | `--input` |
| `accent-h`, `accent-s`, `accent-l` | `--primary`, `--ring`, `--sidebar-primary`, `--sidebar-ring` (as `hsl(h s% l%)`) |
| derived luminance contrast | `--primary-foreground`, `--sidebar-primary-foreground` |
| `color-red` | `--destructive` |
| `color-blue` | `--chart-1` |
| `color-green` | `--chart-2` |
| `color-orange` (?? `color-yellow`) | `--chart-3` |
| `color-purple` | `--chart-4` |
| `color-pink` (?? `color-cyan`) | `--chart-5` |
| `--radius` | _never overridden_ |

**Pragmatic rule**: if a source variable is missing from a scheme, the token is
skipped entirely and the base `theme.css` value cascades through. For example:

- **Dracula** has no light-mode palette, so Dracula + light ≈ default light.
- **E-ink** and **Sky** provide minimal or no chart colors; those tokens fall
  back to the base theme.

---

## How to Regenerate

Re-reads all `.scss` sources, regenerates `src/styles/color-schemes.css`, and
backfills swatches in `src/config/color-schemes.ts`:

```bash
node scripts/generate-color-schemes.mjs
```

Run this after adding or updating a scheme source file.

---

## How to Add a New Scheme

1. Download the Obsidian Minimal `.scss` file for the scheme into
   `scripts/obsidian-schemes/`.
2. Add an entry (with a placeholder swatch) to `COLOR_SCHEMES` in
   `src/config/color-schemes.ts`:
   ```ts
   { value: 'my-scheme', label: 'My Scheme', swatch: { light: '#000000', dark: '#ffffff' } },
   ```
3. Run `node scripts/generate-color-schemes.mjs` — it will generate the CSS
   block and backfill the real swatch colors.
4. Update the **Scheme List** table in this document.

Keep this document in sync whenever schemes are added, removed, or renamed.

---

## Do Not Hand-Edit

`src/styles/color-schemes.css` is **generated output**. Any manual edits will
be overwritten the next time `node scripts/generate-color-schemes.mjs` runs.
Edit the upstream `.scss` sources under `scripts/obsidian-schemes/` and
re-generate instead.
