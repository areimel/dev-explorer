import { invoke } from '@tauri-apps/api/core'

import type { DetectedProject, GitStatus, ProjectDetails } from './types'

export const tauriCommands = {
  scanRoot: (rootPath: string) =>
    invoke<DetectedProject[]>('scan_root', { rootPath }),
  readProjectDetails: (path: string) =>
    invoke<ProjectDetails>('read_project_details', { path }),
  openWithLauncher: (projectPath: string, commandTemplate: string) =>
    invoke<void>('open_with_launcher', { projectPath, commandTemplate }),
  revealInExplorer: (path: string) =>
    invoke<void>('reveal_in_explorer', { path }),
  getGitStatuses: (paths: string[]) =>
    invoke<Record<string, GitStatus>>('get_git_statuses', { paths }),
}
