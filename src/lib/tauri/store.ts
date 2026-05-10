import { LazyStore } from '@tauri-apps/plugin-store'

import type { Launcher, Project, ScanRoot } from './types'

const store = new LazyStore('settings.json')

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

export const tauriStore = {
  async get<K extends keyof StoreShape>(key: K): Promise<StoreShape[K]> {
    const value = await store.get<StoreShape[K]>(key)
    return value ?? defaults[key]
  },
  async set<K extends keyof StoreShape>(key: K, value: StoreShape[K]) {
    await store.set(key, value)
    await store.save()
  },
}
