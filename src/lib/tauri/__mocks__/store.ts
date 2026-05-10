import { vi } from 'vitest'

import type { Launcher, Project, ScanRoot } from '../types'

type StoreShape = {
  scanRoots: ScanRoot[]
  launchers: Launcher[]
  projects: Project[]
}

const defaults: StoreShape = {
  scanRoots: [],
  launchers: [],
  projects: [],
}

const memStore = new Map<keyof StoreShape, StoreShape[keyof StoreShape]>()

export const tauriStore = {
  get: vi.fn(async <K extends keyof StoreShape>(key: K): Promise<StoreShape[K]> => {
    const value = memStore.get(key)
    return (value as StoreShape[K]) ?? defaults[key]
  }),
  set: vi.fn(async <K extends keyof StoreShape>(key: K, value: StoreShape[K]) => {
    memStore.set(key, value)
  }),
}
