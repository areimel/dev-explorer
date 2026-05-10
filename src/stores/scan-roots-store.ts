import { v4 as uuid } from 'uuid'
import { create } from 'zustand'

import { tauriStore } from '@/lib/tauri/store'
import type { ScanRoot } from '@/lib/tauri/types'

type State = {
  roots: ScanRoot[]
  loaded: boolean
  load: () => Promise<void>
  add: (path: string, label?: string) => Promise<ScanRoot>
  remove: (id: string) => Promise<void>
}

export const useScanRootsStore = create<State>((set, get) => ({
  roots: [],
  loaded: false,
  async load() {
    if (get().loaded) return
    const roots = await tauriStore.get('scanRoots')
    set({ roots, loaded: true })
  },
  async add(path, label) {
    const root: ScanRoot = { id: uuid(), path, label }
    const next = [...get().roots, root]
    set({ roots: next })
    await tauriStore.set('scanRoots', next)
    return root
  },
  async remove(id) {
    const next = get().roots.filter((r) => r.id !== id)
    set({ roots: next })
    await tauriStore.set('scanRoots', next)
  },
}))
