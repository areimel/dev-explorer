import { v4 as uuid } from 'uuid'
import { create } from 'zustand'

import { dbRepo } from '@/lib/tauri/db'
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
    const roots = await dbRepo.listScanRoots()
    set({ roots, loaded: true })
  },
  async add(path, label) {
    const root: ScanRoot = { id: uuid(), path, label }
    set({ roots: [...get().roots, root] })
    await dbRepo.upsertScanRoot(root)
    return root
  },
  async remove(id) {
    set({ roots: get().roots.filter((r) => r.id !== id) })
    await dbRepo.deleteScanRoot(id)
  },
}))
