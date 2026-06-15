import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  ignore: [
    'src/components/ui/**',
    'src/components/layout/app-title.tsx',
    'src/tanstack-table.d.ts',
    // shadcn-adjacent helpers retained for future use
    'src/components/coming-soon.tsx',
    'src/components/date-picker.tsx',
    'src/components/learn-more.tsx',
    'src/components/long-text.tsx',
    'src/components/select-dropdown.tsx',
    // data-table primitives are explicitly designed-for-reuse (per CLAUDE.md);
    // bulk-actions hasn't been wired into the projects table yet.
    'src/components/data-table/bulk-actions.tsx',
    // One-shot codegen for the color schemes; run manually, not imported.
    // See COLOR_SCHEMES.md.
    'scripts/generate-color-schemes.mjs',
  ],
  ignoreDependencies: [
    // Loaded by Tauri runtime via plugin registration in src-tauri/src/lib.rs,
    // not imported in TS code.
    '@tauri-apps/plugin-fs',
    '@tauri-apps/plugin-shell',
    '@tauri-apps/plugin-opener',
    // Used transitively by shadcn ui primitives in src/components/ui/**
    '@radix-ui/react-switch',
    'input-otp',
    'react-day-picker',
  ],
}

export default config