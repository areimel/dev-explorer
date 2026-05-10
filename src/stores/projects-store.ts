import { v4 as uuid } from 'uuid'
import { create } from 'zustand'

import { tauriCommands } from '@/lib/tauri/commands'
import { tauriStore } from '@/lib/tauri/store'
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
    const projects = await tauriStore.get('projects')
    set({ projects, loaded: true })
  },
  async rescanRoot(rootId) {
    const { roots } = useScanRootsStore.getState()
    const root = roots.find((r) => r.id === rootId)
    if (!root) return

    const detected = await tauriCommands.scanRoot(root.path)
    const detectedPaths = new Set(detected.map((d) => d.path))

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

    // Also keep scanned projects from this root that disappeared (filter them out)
    // detectedPaths excludes disappeared ones — updated only contains returned paths
    void detectedPaths // used implicitly via detected.map above

    const next = [...unchanged, ...updated]
    set({ projects: next })
    await tauriStore.set('projects', next)
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
    const next = [...get().projects, project]
    set({ projects: next })
    await tauriStore.set('projects', next)
    return project
  },
  async rename(id, name) {
    const next = get().projects.map((p) => (p.id === id ? { ...p, name } : p))
    set({ projects: next })
    await tauriStore.set('projects', next)
  },
  async remove(id) {
    const next = get().projects.filter((p) => p.id !== id)
    set({ projects: next })
    await tauriStore.set('projects', next)
  },
}))
