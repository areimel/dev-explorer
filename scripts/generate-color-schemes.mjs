#!/usr/bin/env node
/**
 * AUTO-GENERATOR for src/styles/color-schemes.css
 *
 * Reads scripts/obsidian-schemes/*.scss, maps Obsidian Minimal variables to
 * shadcn/ui semantic tokens, and emits CSS + backfills swatch hexes into
 * src/config/color-schemes.ts.
 *
 * Run: node scripts/generate-color-schemes.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// SCSS parsing
// ---------------------------------------------------------------------------

/**
 * Parse all CSS declarations from a block body string.
 * Returns a map of variable-name → value (trimmed, no trailing semicolon).
 * Only captures `--name: value;` declarations; ignores nested rules & comments.
 */
function parseDeclarations(blockBody) {
  const map = {};
  // Strip block comments first
  const stripped = blockBody.replace(/\/\*[\s\S]*?\*\//g, '');
  // Match CSS custom property declarations: --name: value;
  const decRe = /(--[\w-]+)\s*:\s*([^;{}]+);/g;
  let m;
  while ((m = decRe.exec(stripped)) !== null) {
    map[m[1].trim()] = m[2].trim();
  }
  return map;
}

/**
 * Given a multi-selector string (comma-separated), determine if this block
 * should contribute variables to the light theme map.
 *
 * A block qualifies as LIGHT if ANY comma-separated selector is a SIMPLE
 * (no descendant combinator — no whitespace) selector that starts with
 * `.theme-light`. This correctly handles:
 *
 *   - `.theme-light.foo { }` → light ✓ (simple root selector)
 *   - `.theme-dark.foo, .theme-light.foo { }` → light ✓ (shared palette;
 *      the `.theme-light.foo` part is simple)
 *   - `.theme-light.foo.contrast .titlebar, ..., .theme-dark.foo { }` → NOT light ✓
 *      (no selector in this block is simple + theme-light)
 *
 * Obsidian Minimal's combined contrast blocks always have ONLY descendant
 * selectors for the theme-light parts (e.g. `.theme-light.foo .titlebar`).
 * Those are NOT simple selectors, so they are excluded.
 */
function selectorIsLight(selector) {
  const parts = selector.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.some((part) => {
    // Simple selector = no whitespace (no descendant/child combinators)
    if (/\s/.test(part)) return false;
    return part.startsWith('.theme-light');
  });
}

function selectorIsDark(selector) {
  const parts = selector.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.some((part) => {
    const tokens = part.split(/\s+/);
    // The last token should contain theme-dark (covers both standalone and combined blocks)
    const lastToken = tokens[tokens.length - 1];
    return lastToken.includes('theme-dark');
  });
}

/**
 * Parse an SCSS file and return { light: Map, dark: Map } where each map
 * merges all declarations from blocks whose selector includes theme-light /
 * theme-dark at the root (not as ancestor/descendant).
 *
 * Strategy: find every top-level `{...}` block, check if its selector line(s)
 * qualify, then merge declarations. Later blocks override earlier ones for
 * the same var.
 */
function parseSchemeFile(filePath) {
  // Strip top-level block comments before parsing so they don't confuse
  // the selector extraction (some files start with `/* License ... */`).
  const rawSrc = fs.readFileSync(filePath, 'utf8');
  const src = rawSrc.replace(/\/\*[\s\S]*?\*\//g, '');
  const result = { light: {}, dark: {} };

  // Iterate through the file finding top-level `{ ... }` blocks.
  // Track brace depth; depth goes from 0→1 when we open a top-level block.
  let i = 0;
  let blockStart = -1; // position of opening `{`
  let selectorStart = 0; // position where the current selector began
  let depth = 0;

  while (i < src.length) {
    const ch = src[i];

    if (ch === '{') {
      if (depth === 0) {
        blockStart = i;
      }
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && blockStart !== -1) {
        const selector = src.slice(selectorStart, blockStart).trim();
        const body = src.slice(blockStart + 1, i);

        const isLight = selectorIsLight(selector);
        const isDark = selectorIsDark(selector);

        if (isLight || isDark) {
          const decls = parseDeclarations(body);
          if (isLight) Object.assign(result.light, decls);
          if (isDark) Object.assign(result.dark, decls);
        }

        selectorStart = i + 1;
        blockStart = -1;
      }
    }

    i++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Color math helpers
// ---------------------------------------------------------------------------

/** Convert hex #RRGGBB or #RGB to [r,g,b] in 0..255 */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Convert HSL (h: 0-360, s: 0-100, l: 0-100) to [r,g,b] in 0..255 */
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return [f(0), f(8), f(4)];
}

/** Relative luminance of an sRGB triplet [r,g,b] in 0..255 */
function luminance(rgb) {
  return rgb
    .map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    })
    .reduce((acc, c, i) => acc + c * [0.2126, 0.7152, 0.0722][i], 0);
}

/**
 * Parse a color string (hex, hsl(...), rgb(...)) and return luminance.
 * Returns null if unparseable.
 */
function colorLuminance(colorStr) {
  if (!colorStr) return null;
  const s = colorStr.trim();

  if (s.startsWith('#')) {
    try {
      return luminance(hexToRgb(s));
    } catch {
      return null;
    }
  }

  // hsl(H S% L%) or hsl(H, S%, L%)
  const hslM = s.match(
    /^hsl\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%\s*\)/i
  );
  if (hslM) {
    return luminance(
      hslToRgb(parseFloat(hslM[1]), parseFloat(hslM[2]), parseFloat(hslM[3]))
    );
  }

  // rgb(R G B) or rgb(R, G, B)
  const rgbM = s.match(
    /^rgb\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*\)/i
  );
  if (rgbM) {
    return luminance([
      parseFloat(rgbM[1]),
      parseFloat(rgbM[2]),
      parseFloat(rgbM[3]),
    ]);
  }

  return null;
}

/** Convert HSL numbers to a 6-char hex string */
function hslToHex(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l);
  return (
    '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
  );
}

/** Parse a percentage string like "76%" → 76 */
function parsePct(str) {
  if (!str) return null;
  const m = String(str).match(/([\d.]+)%/);
  return m ? parseFloat(m[1]) : null;
}

// ---------------------------------------------------------------------------
// Token mapping
// ---------------------------------------------------------------------------

/**
 * Resolve a token value from a declarations map, trying vars in order.
 * Returns { value, usedVar } or null.
 */
function resolve(map, ...vars) {
  for (const v of vars) {
    if (map[v] !== undefined && map[v] !== '') {
      return { value: map[v], usedVar: v };
    }
  }
  return null;
}

/**
 * Build all shadcn token declarations for one variant (light or dark).
 * Returns { tokens: Record<string,string>, swatchHex: string|null }
 */
function buildTokens(map, schemeName, variant) {
  const tokens = {};
  const warn = (token, msg) => {
    console.warn(`  ${schemeName} ${variant}: ${token} ${msg}`);
  };

  // Helper to emit a token or warn+skip
  const emit = (tokenName, ...vars) => {
    const r = resolve(map, ...vars);
    if (r) {
      tokens[tokenName] = r.value;
    } else {
      warn(tokenName, `skipped (not found: ${vars.join(', ')})`);
    }
  };

  // Background-family tokens
  emit('--background', '--bg1');
  emit('--card', '--bg1');
  emit('--popover', '--bg1');

  // Foreground-family tokens
  emit('--foreground', '--tx1');
  emit('--card-foreground', '--tx1');
  emit('--popover-foreground', '--tx1');

  // Secondary / muted / accent surface
  emit('--secondary', '--bg2');
  emit('--muted', '--bg2');
  emit('--accent', '--bg2');
  emit('--sidebar', '--bg2');

  // Sidebar accent uses bg3 fallback bg2
  const sidebarAccent = resolve(map, '--bg3', '--bg2');
  if (sidebarAccent) {
    tokens['--sidebar-accent'] = sidebarAccent.value;
  } else {
    warn('--sidebar-accent', 'skipped (not found: --bg3, --bg2)');
  }

  // Muted foreground
  const mutedFg = resolve(map, '--tx2', '--tx3');
  if (mutedFg) {
    tokens['--muted-foreground'] = mutedFg.value;
  } else {
    warn('--muted-foreground', 'skipped (not found: --tx2, --tx3)');
  }

  // Secondary/accent/sidebar foregrounds all use tx1
  emit('--secondary-foreground', '--tx1');
  emit('--accent-foreground', '--tx1');
  emit('--sidebar-foreground', '--tx1');
  emit('--sidebar-accent-foreground', '--tx1');

  // Border
  emit('--border', '--ui1');
  emit('--sidebar-border', '--ui1');

  // Input
  const inputR = resolve(map, '--ui2', '--ui1');
  if (inputR) {
    tokens['--input'] = inputR.value;
  } else {
    warn('--input', 'skipped (not found: --ui2, --ui1)');
  }

  // Primary (accent HSL triplet)
  const accentH = map['--accent-h'];
  const accentSRaw = map['--accent-s'];
  const accentLRaw = map['--accent-l'];

  let primaryHsl = null;
  let swatchHex = null;

  if (accentH !== undefined && accentSRaw !== undefined && accentLRaw !== undefined) {
    const h = parseFloat(accentH);
    const s = accentSRaw.includes('%') ? accentSRaw.trim() : accentSRaw.trim() + '%';
    const l = accentLRaw.includes('%') ? accentLRaw.trim() : accentLRaw.trim() + '%';
    primaryHsl = `hsl(${h} ${s} ${l})`;

    const sNum = parsePct(s);
    const lNum = parsePct(l);
    if (sNum !== null && lNum !== null) {
      swatchHex = hslToHex(h, sNum, lNum);
    }

    tokens['--primary'] = primaryHsl;
    tokens['--ring'] = primaryHsl;
    tokens['--sidebar-primary'] = primaryHsl;
    tokens['--sidebar-ring'] = primaryHsl;
  } else {
    warn(
      '--primary, --ring, --sidebar-primary, --sidebar-ring',
      'skipped (accent-h/s/l missing)'
    );
    // Fall back to blue for swatch if available
    if (map['--color-blue'] && map['--color-blue'].startsWith('#')) {
      swatchHex = map['--color-blue'];
    }
  }

  // Primary foreground (derived from luminance)
  if (primaryHsl) {
    const lum = colorLuminance(primaryHsl);
    if (lum !== null) {
      const fgSource = lum > 0.5 ? resolve(map, '--tx1') : null;
      const fgValue =
        fgSource ? fgSource.value : lum > 0.5 ? '#111' : '#fff';
      tokens['--primary-foreground'] = fgValue;
      tokens['--sidebar-primary-foreground'] = fgValue;
    } else {
      warn('--primary-foreground', 'skipped (could not compute luminance)');
    }
  } else {
    warn(
      '--primary-foreground, --sidebar-primary-foreground',
      'skipped (no primary)'
    );
  }

  // Destructive
  emit('--destructive', '--color-red');

  // Charts
  emit('--chart-1', '--color-blue');
  emit('--chart-2', '--color-green');

  const chart3 = resolve(map, '--color-orange', '--color-yellow');
  if (chart3) {
    tokens['--chart-3'] = chart3.value;
  } else {
    warn('--chart-3', 'skipped (not found: --color-orange, --color-yellow)');
  }

  emit('--chart-4', '--color-purple');

  const chart5 = resolve(map, '--color-pink', '--color-cyan');
  if (chart5) {
    tokens['--chart-5'] = chart5.value;
  } else {
    warn('--chart-5', 'skipped (not found: --color-pink, --color-cyan)');
  }

  return { tokens, swatchHex };
}

// ---------------------------------------------------------------------------
// CSS emitter
// ---------------------------------------------------------------------------

function emitCssBlock(selector, tokens) {
  const lines = Object.entries(tokens).map(([k, v]) => `  ${k}: ${v};`);
  // Always emit the block (even if empty) so callers get a predictable count.
  if (lines.length === 0) return `${selector} { /* no overrides — base theme.css applies */ }\n`;
  return `${selector} {\n${lines.join('\n')}\n}\n`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const SCHEMES_DIR = path.join(ROOT, 'scripts', 'obsidian-schemes');
const OUTPUT_CSS = path.join(ROOT, 'src', 'styles', 'color-schemes.css');
const CONFIG_TS = path.join(ROOT, 'src', 'config', 'color-schemes.ts');

// Alphabetical order matching the manifest (minus default)
const SCHEME_ORDER = [
  'atom',
  'ayu',
  'catppuccin',
  'dracula',
  'eink',
  'everforest',
  'flexoki',
  'gruvbox',
  'macos',
  'nord',
  'rose-pine',
  'sky',
  'solarized',
  'things',
];

// Compute swatches and CSS blocks
const swatches = {}; // scheme → { light: hex, dark: hex }
const cssBlocks = [];

cssBlocks.push(
  '/* AUTO-GENERATED by scripts/generate-color-schemes.mjs — do not edit by hand.' +
    ' Run: node scripts/generate-color-schemes.mjs */\n'
);

for (const scheme of SCHEME_ORDER) {
  const filePath = path.join(SCHEMES_DIR, `${scheme}.scss`);
  if (!fs.existsSync(filePath)) {
    console.warn(`WARNING: ${scheme}.scss not found, skipping`);
    continue;
  }

  console.log(`\nProcessing ${scheme}...`);
  const parsed = parseSchemeFile(filePath);

  const lightResult = buildTokens(parsed.light, scheme, 'light');
  const darkResult = buildTokens(parsed.dark, scheme, 'dark');

  swatches[scheme] = {
    light: lightResult.swatchHex || darkResult.swatchHex || '#888888',
    dark: darkResult.swatchHex || lightResult.swatchHex || '#888888',
  };

  const lightBlock = emitCssBlock(
    `[data-color-scheme='${scheme}']:not(.dark)`,
    lightResult.tokens
  );
  const darkBlock = emitCssBlock(
    `[data-color-scheme='${scheme}'].dark`,
    darkResult.tokens
  );

  if (lightBlock) cssBlocks.push(lightBlock);
  if (darkBlock) cssBlocks.push(darkBlock);
}

// Write CSS
const cssOutput = cssBlocks.join('\n');
fs.writeFileSync(OUTPUT_CSS, cssOutput, 'utf8');
console.log(`\n✓ Wrote ${OUTPUT_CSS}`);

// Verify block count
const blockCount = (cssOutput.match(/^\[data-color-scheme=/gm) || []).length;
console.log(`  → ${blockCount} rule blocks (expected 28)`);

// ---------------------------------------------------------------------------
// Backfill swatches into color-schemes.ts
// ---------------------------------------------------------------------------

console.log('\nBackfilling swatches into color-schemes.ts...');
console.log('\nSwatch values:');

for (const [scheme, sw] of Object.entries(swatches)) {
  console.log(`  ${scheme.padEnd(14)} light: ${sw.light}  dark: ${sw.dark}`);
}

// Read current TS file and do line-by-line swatch replacement.
// Each relevant line looks like:
//   { value: 'atom', label: 'Atom', swatch: { light: '#xxxxxx', dark: '#xxxxxx' } },
let tsLines = fs.readFileSync(CONFIG_TS, 'utf8').split('\n');
let anyChanged = false;

for (let idx = 0; idx < tsLines.length; idx++) {
  const line = tsLines[idx];
  for (const [scheme, sw] of Object.entries(swatches)) {
    // Match the line containing value: 'scheme'
    if (!line.includes(`value: '${scheme}'`)) continue;
    // Replace the swatch values in this line
    const updated = line.replace(
      /swatch:\s*\{\s*light:\s*'[^']*',\s*dark:\s*'[^']*'\s*\}/,
      `swatch: { light: '${sw.light}', dark: '${sw.dark}' }`
    );
    if (updated !== line) {
      tsLines[idx] = updated;
      anyChanged = true;
      console.log(`  Updated swatch for '${scheme}'`);
    } else {
      console.warn(`  WARNING: Could not replace swatch for '${scheme}'`);
    }
    break;
  }
}

if (anyChanged) {
  fs.writeFileSync(CONFIG_TS, tsLines.join('\n'), 'utf8');
  console.log(`\n✓ Updated ${CONFIG_TS}`);
} else {
  console.log('\n(no swatch changes needed)');
}

console.log('\nDone!');
