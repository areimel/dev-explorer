import { vi } from 'vitest'

import type { DetectedProject, ProjectDetails } from '../types'

export const tauriCommands = {
  scanRoot: vi.fn(async (_rootPath: string): Promise<DetectedProject[]> => []),
  readProjectDetails: vi.fn(
    async (_path: string): Promise<ProjectDetails> => ({
      path: _path,
      manifests: [],
      readmeMarkdown: null,
      lastModifiedMs: 0,
    })
  ),
  openWithLauncher: vi.fn(async (_p: string, _t: string) => {}),
  revealInExplorer: vi.fn(async (_p: string) => {}),
}
