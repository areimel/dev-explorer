import { v4 as uuid } from 'uuid'
import { create } from 'zustand'

import { dbRepo } from '@/lib/tauri/db'
import type { Launcher } from '@/lib/tauri/types'

const DEFAULT_LAUNCHERS: Launcher[] = [
  {
    id: uuid(),
    name: 'VS Code',
    icon: 'Code',
    commandTemplate: 'code "{path}"',
  },
  {
    id: uuid(),
    name: 'Terminal',
    icon: 'Terminal',
    commandTemplate: 'wt -d "{path}"',
  },
  {
    id: uuid(),
    name: 'File Explorer',
    icon: 'Folder',
    commandTemplate: 'explorer "{path}"',
  },
]

type State = {
  launchers: Launcher[]
  loaded: boolean
  load: () => Promise<void>
  add: (launcher: Omit<Launcher, 'id'>) => Promise<Launcher>
  update: (id: string, patch: Partial<Omit<Launcher, 'id'>>) => Promise<void>
  remove: (id: string) => Promise<void>
  reorder: (orderedIds: string[]) => Promise<void>
}

export const useLaunchersStore = create<State>((set, get) => ({
  launchers: [],
  loaded: false,
  async load() {
    if (get().loaded) return
    const stored = await dbRepo.listLaunchers()
    if (stored.length > 0) {
      set({ launchers: stored, loaded: true })
      return
    }
    // Seed defaults when the DB is empty
    for (let i = 0; i < DEFAULT_LAUNCHERS.length; i++) {
      await dbRepo.upsertLauncher(DEFAULT_LAUNCHERS[i], i)
    }
    set({ launchers: DEFAULT_LAUNCHERS, loaded: true })
  },
  async add(launcher) {
    const newLauncher: Launcher = { id: uuid(), ...launcher }
    set({ launchers: [...get().launchers, newLauncher] })
    await dbRepo.upsertLauncher(newLauncher)
    return newLauncher
  },
  async update(id, patch) {
    const next = get().launchers.map((l) =>
      l.id === id ? { ...l, ...patch } : l
    )
    set({ launchers: next })
    const updated = next.find((l) => l.id === id)
    if (updated) await dbRepo.upsertLauncher(updated)
  },
  async remove(id) {
    set({ launchers: get().launchers.filter((l) => l.id !== id) })
    await dbRepo.deleteLauncher(id)
  },
  async reorder(orderedIds) {
    const launcherMap = new Map(get().launchers.map((l) => [l.id, l]))
    const next = orderedIds
      .map((id) => launcherMap.get(id))
      .filter((l): l is Launcher => l !== undefined)
    set({ launchers: next })
    await dbRepo.setLauncherOrder(orderedIds)
  },
}))
