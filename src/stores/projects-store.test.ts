import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/tauri/db')
vi.mock('@/lib/tauri/commands')

import { tauriCommands } from '@/lib/tauri/commands'
import { dbRepo } from '@/lib/tauri/db'

import { useScanRootsStore } from './scan-roots-store'
import { useProjectsStore } from './projects-store'

const MOCK_ROOT_ID = 'root-1'
const MOCK_ROOT_PATH = 'C:\\Dev'

describe('projects-store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dbRepo.listProjects).mockResolvedValue([])
    vi.mocked(dbRepo.upsertProject).mockResolvedValue(undefined)
    vi.mocked(dbRepo.upsertProjects).mockResolvedValue(undefined)
    vi.mocked(dbRepo.deleteProject).mockResolvedValue(undefined)
    vi.mocked(dbRepo.deleteScannedProjectsForRoot).mockResolvedValue(undefined)
    vi.mocked(tauriCommands.scanRoot).mockResolvedValue([])
    useScanRootsStore.setState({
      roots: [{ id: MOCK_ROOT_ID, path: MOCK_ROOT_PATH }],
      loaded: true,
    })
    useProjectsStore.setState({ projects: [], loaded: false })
  })

  it('rescans a root and adds new projects', async () => {
    vi.mocked(tauriCommands.scanRoot).mockResolvedValue([
      {
        path: 'C:\\Dev\\foo',
        name: 'foo',
        manifests: ['package.json'],
        language: 'node',
        lastModifiedMs: 0,
      },
    ])

    const store = useProjectsStore.getState()
    await store.load()
    await store.rescanRoot(MOCK_ROOT_ID)

    const { projects } = useProjectsStore.getState()
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe('foo')
    expect(projects[0].source).toBe('scanned')
    expect(projects[0].scanRootId).toBe(MOCK_ROOT_ID)
    expect(dbRepo.upsertProjects).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: 'foo' })])
    )
  })

  it('removes disappeared scanned projects on rescan', async () => {
    // First scan adds 'foo'
    vi.mocked(tauriCommands.scanRoot).mockResolvedValue([
      {
        path: 'C:\\Dev\\foo',
        name: 'foo',
        manifests: [],
        language: null,
        lastModifiedMs: 0,
      },
    ])
    await useProjectsStore.getState().load()
    await useProjectsStore.getState().rescanRoot(MOCK_ROOT_ID)
    expect(useProjectsStore.getState().projects).toHaveLength(1)

    // Second scan — foo is gone
    vi.mocked(tauriCommands.scanRoot).mockResolvedValue([])
    await useProjectsStore.getState().rescanRoot(MOCK_ROOT_ID)
    expect(useProjectsStore.getState().projects).toHaveLength(0)
    expect(dbRepo.deleteScannedProjectsForRoot).toHaveBeenCalledWith(
      MOCK_ROOT_ID,
      []
    )
  })

  it('preserves manual projects across rescan', async () => {
    await useProjectsStore.getState().load()
    await useProjectsStore.getState().addManual('C:\\Other\\bar')
    expect(useProjectsStore.getState().projects).toHaveLength(1)

    vi.mocked(tauriCommands.scanRoot).mockResolvedValue([])
    await useProjectsStore.getState().rescanRoot(MOCK_ROOT_ID)

    const { projects } = useProjectsStore.getState()
    expect(projects).toHaveLength(1)
    expect(projects[0].source).toBe('manual')
  })

  it('renames a project and persists', async () => {
    vi.mocked(tauriCommands.scanRoot).mockResolvedValue([
      {
        path: 'C:\\Dev\\foo',
        name: 'foo',
        manifests: [],
        language: null,
        lastModifiedMs: 0,
      },
    ])
    await useProjectsStore.getState().load()
    await useProjectsStore.getState().rescanRoot(MOCK_ROOT_ID)

    const { projects } = useProjectsStore.getState()
    await useProjectsStore.getState().rename(projects[0].id, 'My Foo')
    expect(useProjectsStore.getState().projects[0].name).toBe('My Foo')
    expect(dbRepo.upsertProject).toHaveBeenCalledWith(
      expect.objectContaining({ id: projects[0].id, name: 'My Foo' })
    )
  })
})
