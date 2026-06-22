import { vi } from 'vitest'

import type { Launcher, Project, ScanRoot, Template } from '../types'

export const dbRepo = {
  listProjects: vi.fn(async (): Promise<Project[]> => []),
  upsertProject: vi.fn(async (_p: Project): Promise<void> => {}),
  upsertProjects: vi.fn(async (_ps: Project[]): Promise<void> => {}),
  deleteProject: vi.fn(async (_id: string): Promise<void> => {}),
  deleteScannedProjectsForRoot: vi.fn(
    async (_rootId: string, _keepPaths: string[]): Promise<void> => {}
  ),
  listScanRoots: vi.fn(async (): Promise<ScanRoot[]> => []),
  upsertScanRoot: vi.fn(async (_r: ScanRoot): Promise<void> => {}),
  deleteScanRoot: vi.fn(async (_id: string): Promise<void> => {}),
  listLaunchers: vi.fn(async (): Promise<Launcher[]> => []),
  upsertLauncher: vi.fn(
    async (_l: Launcher, _sortOrder?: number): Promise<void> => {}
  ),
  deleteLauncher: vi.fn(async (_id: string): Promise<void> => {}),
  setLauncherOrder: vi.fn(async (_orderedIds: string[]): Promise<void> => {}),
  listTemplates: vi.fn(async (): Promise<Template[]> => []),
  upsertTemplate: vi.fn(
    async (_t: Template, _sortOrder?: number): Promise<void> => {}
  ),
  deleteTemplate: vi.fn(async (_id: string): Promise<void> => {}),
  setTemplateOrder: vi.fn(async (_orderedIds: string[]): Promise<void> => {}),
  setPinned: vi.fn(async (_projectId: string, _pinned: boolean): Promise<void> => {}),
  getPinnedIds: vi.fn(async (): Promise<string[]> => []),
  touchOpened: vi.fn(async (_projectId: string): Promise<void> => {}),
  getRecentlyOpened: vi.fn(async (_limit: number): Promise<string[]> => []),
  getMeta: vi.fn(async (_key: string): Promise<string | null> => null),
  setMeta: vi.fn(async (_key: string, _value: string): Promise<void> => {}),
  getSchema: vi.fn(async () => []),
}
