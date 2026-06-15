/**
 * Color schemes available in addition to the light/dark *mode* axis.
 *
 * A color scheme is orthogonal to mode: the selected scheme + the resolved
 * mode (light/dark) together select one token set. `default` is the built-in
 * shadcn palette defined in `src/styles/theme.css`; the others are sourced
 * from the Obsidian Minimal theme and emitted into
 * `src/styles/color-schemes.css` by `scripts/generate-color-schemes.mjs`.
 *
 * 📝 How to add a new color scheme — see `COLOR_SCHEMES.md` in the repo root.
 * In short: drop the `.scss` source into `scripts/obsidian-schemes/`, add an
 * entry to `COLOR_SCHEMES` below, then run
 * `node scripts/generate-color-schemes.mjs` (it backfills the swatches and
 * regenerates the CSS).
 *
 * The scheme is applied as a `data-color-scheme="<value>"` attribute on the
 * `<html>` element; `default` removes the attribute entirely so the base
 * `theme.css` tokens apply unchanged.
 */

/** Cookie that persists the selected color scheme (1 year, see theme-provider). */
export const COLOR_SCHEME_COOKIE_NAME = 'vite-ui-color-scheme'

/** Attribute set on `<html>` to activate a non-default scheme. */
export const COLOR_SCHEME_ATTRIBUTE = 'data-color-scheme'

/** The built-in shadcn palette (no `data-color-scheme` attribute). */
export const DEFAULT_COLOR_SCHEME = 'default'

type ColorSchemeMeta = {
  value: string
  label: string
  /** Representative accent swatch per mode (backfilled by the generator). */
  swatch: { light: string; dark: string }
}

/**
 * Source of truth for the scheme list, the `ColorScheme` union, and the UI
 * pickers. `default` is first; the rest are alphabetical by label.
 *
 * `swatch` values are auto-backfilled by `scripts/generate-color-schemes.mjs`
 * from each scheme's accent color — placeholders below are replaced on
 * regeneration.
 */
export const COLOR_SCHEMES = [
  {
    value: 'default',
    label: 'Default',
    swatch: { light: '#3b3b54', dark: '#e5e7eb' },
  },
  {
    value: 'atom',
    label: 'Atom',
    swatch: { light: '#546be8', dark: '#598cf3' },
  },
  { value: 'ayu', label: 'Ayu', swatch: { light: '#ff9900', dark: '#e6b451' } },
  {
    value: 'catppuccin',
    label: 'Catppuccin',
    swatch: { light: '#dc8b79', dark: '#f2d5cf' },
  },
  {
    value: 'dracula',
    label: 'Dracula',
    swatch: { light: '#bf95f9', dark: '#bf95f9' },
  },
  {
    value: 'eink',
    label: 'E-ink',
    swatch: { light: '#000000', dark: '#ffffff' },
  },
  {
    value: 'everforest',
    label: 'Everforest',
    swatch: { light: '#91b25c', dark: '#aac181' },
  },
  {
    value: 'flexoki',
    label: 'Flexoki',
    swatch: { light: '#24847c', dark: '#3baba2' },
  },
  {
    value: 'gruvbox',
    label: 'Gruvbox',
    swatch: { light: '#d85f0e', dark: '#d85f0e' },
  },
  {
    value: 'macos',
    label: 'macOS',
    swatch: { light: '#0077ff', dark: '#0077ff' },
  },
  {
    value: 'nord',
    label: 'Nord',
    swatch: { light: '#5d81ac', dark: '#5d81ac' },
  },
  {
    value: 'rose-pine',
    label: 'Rosé Pine',
    swatch: { light: '#d7837e', dark: '#ebbdbc' },
  },
  { value: 'sky', label: 'Sky', swatch: { light: '#2eaadc', dark: '#2eaadc' } },
  {
    value: 'solarized',
    label: 'Solarized',
    swatch: { light: '#2589d0', dark: '#2589d0' },
  },
  {
    value: 'things',
    label: 'Things',
    swatch: { light: '#1a60c1', dark: '#5095f7' },
  },
] as const satisfies readonly ColorSchemeMeta[]

export type ColorScheme = (typeof COLOR_SCHEMES)[number]['value']
