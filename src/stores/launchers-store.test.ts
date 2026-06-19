import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/tauri/db')
vi.mock('@/lib/tauri/commands')

import { dbRepo } from '@/lib/tauri/db'

import { useLaunchersStore } from './launchers-store'

describe('launchers-store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbRepo.listLaunchers).mockResolvedValue([])
    vi.mocked(dbRepo.upsertLauncher).mockResolvedValue(undefined)
    vi.mocked(dbRepo.deleteLauncher).mockResolvedValue(undefined)
    vi.mocked(dbRepo.setLauncherOrder).mockResolvedValue(undefined)
    useLaunchersStore.setState({ launchers: [], loaded: false })
  })

  it('seeds defaults on first load when store is empty', async () => {
    const store = useLaunchersStore.getState()
    await store.load()
    const { launchers } = useLaunchersStore.getState()
    expect(launchers.length).toBeGreaterThan(0)
    expect(launchers.some((l) => l.name === 'VS Code')).toBe(true)
    expect(dbRepo.upsertLauncher).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'VS Code' }),
      0
    )
  })

  it('adds a launcher and persists', async () => {
    const store = useLaunchersStore.getState()
    await store.load()
    const launcher = await store.add({
      name: 'Cursor',
      icon: 'Code',
      commandTemplate: 'cursor "{path}"',
    })
    expect(useLaunchersStore.getState().launchers).toContainEqual(
      expect.objectContaining({ name: 'Cursor' })
    )
    expect(launcher.id).toBeDefined()
  })

  it('removes a launcher and persists', async () => {
    const store = useLaunchersStore.getState()
    await store.load()
    const { launchers } = useLaunchersStore.getState()
    const first = launchers[0]
    await useLaunchersStore.getState().remove(first.id)
    expect(
      useLaunchersStore.getState().launchers.find((l) => l.id === first.id)
    ).toBeUndefined()
    expect(dbRepo.deleteLauncher).toHaveBeenCalledWith(first.id)
  })

  it('reorders launchers', async () => {
    const store = useLaunchersStore.getState()
    await store.load()
    const { launchers } = useLaunchersStore.getState()
    const reversed = [...launchers].reverse().map((l) => l.id)
    await useLaunchersStore.getState().reorder(reversed)
    const reordered = useLaunchersStore.getState().launchers
    expect(reordered.map((l) => l.id)).toEqual(reversed)
    expect(dbRepo.setLauncherOrder).toHaveBeenCalledWith(reversed)
  })
})
