import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/tauri/store')
vi.mock('@/lib/tauri/commands')

import { tauriStore } from '@/lib/tauri/store'

import { useScanRootsStore } from './scan-roots-store'

describe('scan-roots-store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tauriStore.get).mockResolvedValue([])
    vi.mocked(tauriStore.set).mockResolvedValue(undefined)
    useScanRootsStore.setState({ roots: [], loaded: false })
  })

  it('adds a root and persists', async () => {
    const store = useScanRootsStore.getState()
    await store.load()
    const root = await store.add('C:\\Dev')
    expect(useScanRootsStore.getState().roots).toContain(root)
    expect(tauriStore.set).toHaveBeenCalledWith(
      'scanRoots',
      expect.arrayContaining([root])
    )
  })

  it('does not reload if already loaded', async () => {
    const store = useScanRootsStore.getState()
    await store.load()
    await store.load()
    expect(tauriStore.get).toHaveBeenCalledTimes(1)
  })

  it('removes a root and persists', async () => {
    const store = useScanRootsStore.getState()
    await store.load()
    const root = await store.add('C:\\Dev')
    vi.mocked(tauriStore.set).mockClear()
    await useScanRootsStore.getState().remove(root.id)
    expect(useScanRootsStore.getState().roots).not.toContain(root)
    expect(tauriStore.set).toHaveBeenCalledWith('scanRoots', [])
  })
})
