import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/tauri/db')
vi.mock('@/lib/tauri/commands')

import { dbRepo } from '@/lib/tauri/db'

import { useScanRootsStore } from './scan-roots-store'

describe('scan-roots-store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbRepo.listScanRoots).mockResolvedValue([])
    vi.mocked(dbRepo.upsertScanRoot).mockResolvedValue(undefined)
    vi.mocked(dbRepo.deleteScanRoot).mockResolvedValue(undefined)
    useScanRootsStore.setState({ roots: [], loaded: false })
  })

  it('adds a root and persists', async () => {
    const store = useScanRootsStore.getState()
    await store.load()
    const root = await store.add('C:\\Dev')
    expect(useScanRootsStore.getState().roots).toContain(root)
    expect(dbRepo.upsertScanRoot).toHaveBeenCalledWith(root)
  })

  it('does not reload if already loaded', async () => {
    const store = useScanRootsStore.getState()
    await store.load()
    await store.load()
    expect(dbRepo.listScanRoots).toHaveBeenCalledTimes(1)
  })

  it('removes a root and persists', async () => {
    const store = useScanRootsStore.getState()
    await store.load()
    const root = await store.add('C:\\Dev')
    vi.mocked(dbRepo.upsertScanRoot).mockClear()
    await useScanRootsStore.getState().remove(root.id)
    expect(useScanRootsStore.getState().roots).not.toContain(root)
    expect(dbRepo.deleteScanRoot).toHaveBeenCalledWith(root.id)
  })
})
