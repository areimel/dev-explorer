import { v4 as uuid } from 'uuid'
import { create } from 'zustand'
import { tauriCommands } from '@/lib/tauri/commands'
import { dbRepo } from '@/lib/tauri/db'
import type { Project } from '@/lib/tauri/types'
import { useScanRootsStore } from './scan-roots-store'

type State = {
  projects: Project[]
  pinnedIds: string[]
  templateProjectIds: string[]
  recentIds: string[]
  loaded: boolean
  load: () => Promise<void>
  rescanRoot: (rootId: string) => Promise<void>
  rescanAll: () => Promise<void>
  addManual: (path: string) => Promise<Project>
  rename: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  toggleTemplateProject: (id: string) => Promise<void>
  recordOpen: (id: string) => Promise<void>
  recordOpenByPath: (path: string) => Promise<void>
}

const RECENT_LIMIT = 12

export const useProjectsStore = create<State>((set, get) => ({
  projects: [],
  pinnedIds: [],
  templateProjectIds: [],
  recentIds: [],
  loaded: false,
  async load() {
    if (get().loaded) return
    const [projects, pinnedIds, templateProjectIds, recentIds] =
      await Promise.all([
        dbRepo.listProjects(),
        dbRepo.getPinnedIds(),
        dbRepo.getTemplateProjectIds(),
        dbRepo.getRecentlyOpened(RECENT_LIMIT),
      ])
    set({ projects, pinnedIds, templateProjectIds, recentIds, loaded: true })
  },
  async rescanRoot(rootId) {
    const { roots } = useScanRootsStore.getState()
    const root = roots.find((r) => r.id === rootId)
    if (!root) return

    const detected = await tauriCommands.scanRoot(root.path)
    const detectedPaths = detected.map((d) => d.path)

    const existing = get().projects
    // Keep manual projects and scanned projects from OTHER roots untouched
    const unchanged = existing.filter(
      (p) => p.source === 'manual' || p.scanRootId !== rootId
    )

    const updated: Project[] = detected.map((d) => {
      const prev = existing.find((p) => p.path === d.path)
      if (prev) {
        // Update mutable fields, preserve id/name/source
        return {
          ...prev,
          language: d.language,
          manifests: d.manifests,
          lastModifiedMs: d.lastModifiedMs,
        }
      }
      return {
        id: uuid(),
        path: d.path,
        name: d.name,
        source: 'scanned' as const,
        scanRootId: rootId,
        language: d.language,
        manifests: d.manifests,
        lastModifiedMs: d.lastModifiedMs,
      }
    })

    const next = [...unchanged, ...updated]
    set({ projects: next })
    // Persist updated/new scanned projects, then prune disappeared ones
    await dbRepo.upsertProjects(updated)
    await dbRepo.deleteScannedProjectsForRoot(rootId, detectedPaths)
  },
  async rescanAll() {
    const { roots } = useScanRootsStore.getState()
    for (const root of roots) {
      await get().rescanRoot(root.id)
    }
  },
  async addManual(path) {
    const name = path.split(/[\\/]/).filter(Boolean).pop() ?? path
    const project: Project = {
      id: uuid(),
      path,
      name,
      source: 'manual',
      scanRootId: null,
      language: null,
      manifests: [],
      lastModifiedMs: Date.now(),
    }
    set({ projects: [...get().projects, project] })
    await dbRepo.upsertProject(project)
    return project
  },
  async rename(id, name) {
    const next = get().projects.map((p) => (p.id === id ? { ...p, name } : p))
    set({ projects: next })
    const updated = next.find((p) => p.id === id)
    if (updated) await dbRepo.upsertProject(updated)
  },
  async remove(id) {
    set({
      projects: get().projects.filter((p) => p.id !== id),
      pinnedIds: get().pinnedIds.filter((pid) => pid !== id),
      templateProjectIds: get().templateProjectIds.filter((tid) => tid !== id),
      recentIds: get().recentIds.filter((rid) => rid !== id),
    })
    // FK ON DELETE CASCADE drops the project_overrides row server-side.
    await dbRepo.deleteProject(id)
  },
  async togglePin(id) {
    const next = !get().pinnedIds.includes(id)
    set({
      pinnedIds: next
        ? [...get().pinnedIds, id]
        : get().pinnedIds.filter((pid) => pid !== id),
    })
    await dbRepo.setPinned(id, next)
  },
  async toggleTemplateProject(id) {
    const next = !get().templateProjectIds.includes(id)
    set({
      templateProjectIds: next
        ? [...get().templateProjectIds, id]
        : get().templateProjectIds.filter((tid) => tid !== id),
    })
    await dbRepo.setTemplateFlag(id, next)
  },
  async recordOpen(id) {
    await dbRepo.touchOpened(id)
    const recentIds = await dbRepo.getRecentlyOpened(RECENT_LIMIT)
    set({ recentIds })
  },
  async recordOpenByPath(path) {
    const project = get().projects.find((p) => p.path === path)
    if (!project) return
    await get().recordOpen(project.id)
  },
}))
