import { v4 as uuid } from 'uuid'
import { create } from 'zustand'

import { tauriStore } from '@/lib/tauri/store'
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
    const stored = await tauriStore.get('launchers')
    const launchers = stored.length > 0 ? stored : DEFAULT_LAUNCHERS
    if (stored.length === 0) {
      await tauriStore.set('launchers', launchers)
    }
    set({ launchers, loaded: true })
  },
  async add(launcher) {
    const newLauncher: Launcher = { id: uuid(), ...launcher }
    const next = [...get().launchers, newLauncher]
    set({ launchers: next })
    await tauriStore.set('launchers', next)
    return newLauncher
  },
  async update(id, patch) {
    const next = get().launchers.map((l) =>
      l.id === id ? { ...l, ...patch } : l
    )
    set({ launchers: next })
    await tauriStore.set('launchers', next)
  },
  async remove(id) {
    const next = get().launchers.filter((l) => l.id !== id)
    set({ launchers: next })
    await tauriStore.set('launchers', next)
  },
  async reorder(orderedIds) {
    const launcherMap = new Map(get().launchers.map((l) => [l.id, l]))
    const next = orderedIds
      .map((id) => launcherMap.get(id))
      .filter((l): l is Launcher => l !== undefined)
    set({ launchers: next })
    await tauriStore.set('launchers', next)
  },
}))
