import { vi } from 'vitest'

import type { Launcher, Project, ScanRoot } from '../types'

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
  getMeta: vi.fn(async (_key: string): Promise<string | null> => null),
  setMeta: vi.fn(async (_key: string, _value: string): Promise<void> => {}),
  migrateFromStore: vi.fn(async (): Promise<void> => {}),
  getSchema: vi.fn(async () => []),
}
