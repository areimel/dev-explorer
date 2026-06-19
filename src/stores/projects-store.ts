import { v4 as uuid } from 'uuid'
import { create } from 'zustand'

import { tauriCommands } from '@/lib/tauri/commands'
import { dbRepo } from '@/lib/tauri/db'
import type { Project } from '@/lib/tauri/types'

import { useScanRootsStore } from './scan-roots-store'

type State = {
  projects: Project[]
  loaded: boolean
  load: () => Promise<void>
  rescanRoot: (rootId: string) => Promise<void>
  rescanAll: () => Promise<void>
  addManual: (path: string) => Promise<Project>
  rename: (id: string, name: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useProjectsStore = create<State>((set, get) => ({
  projects: [],
  loaded: false,
  async load() {
    if (get().loaded) return
    const projects = await dbRepo.listProjects()
    set({ projects, loaded: true })
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
    set({ projects: get().projects.filter((p) => p.id !== id) })
    await dbRepo.deleteProject(id)
  },
}))
