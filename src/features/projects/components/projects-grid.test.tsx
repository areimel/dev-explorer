import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useProjectsStore } from '@/stores/projects-store'
import { tauriCommands } from '@/lib/tauri/commands'
import type { GitStatus, Project } from '@/lib/tauri/types'
import { projectsColumns } from './projects-columns'
import { ProjectsGrid } from './projects-grid'
import { ProjectsProvider } from './projects-provider'

vi.mock('@/lib/tauri/commands')
vi.mock('./project-card', () => ({
  ProjectCard: ({ project }: { project: { name: string } }) => (
    <div data-testid='project-card'>{project.name}</div>
  ),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProject(i: number): Project {
  return {
    id: `project-${i}`,
    path: `C:\\Dev\\project-${i}`,
    name: `Project ${i}`,
    source: i % 3 === 0 ? 'manual' : 'scanned',
    scanRootId: i % 3 === 0 ? null : 'root-1',
    language: i % 2 === 0 ? 'typescript' : 'rust',
    manifests: [],
    lastModifiedMs: Date.now() - i * 1000,
  }
}

const FIXTURE_PROJECTS: Project[] = Array.from({ length: 25 }, (_, i) =>
  makeProject(i + 1)
)

const FIXTURE_GIT_STATUS: GitStatus = {
  isRepo: true,
  branch: 'main',
  isDirty: false,
  detached: false,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
}

/**
 * Wrapper that creates a real TanStack table and renders ProjectsGrid.
 * Accepts an optional initial columnFilters state.
 */
function GridWrapper({
  projects,
  initialColumnFilters = [],
}: {
  projects: Project[]
  initialColumnFilters?: ColumnFiltersState
}) {
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>(initialColumnFilters)

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: projects,
    columns: projectsColumns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Default pageSize of 10 — grid must ignore pagination and show ALL rows
    initialState: { pagination: { pageSize: 10, pageIndex: 0 } },
  })

  return <ProjectsGrid table={table} />
}

async function renderGrid({
  projects = FIXTURE_PROJECTS,
  initialColumnFilters = [],
}: {
  projects?: Project[]
  initialColumnFilters?: ColumnFiltersState
} = {}) {
  const queryClient = makeQueryClient()

  // Seed the store so useGitStatuses picks up the paths
  useProjectsStore.setState({ projects, loaded: true })

  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectsProvider>
        <GridWrapper
          projects={projects}
          initialColumnFilters={initialColumnFilters}
        />
      </ProjectsProvider>
    </QueryClientProvider>
  )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProjectsGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const statusMap: Record<string, GitStatus> = {}
    FIXTURE_PROJECTS.forEach((p) => {
      statusMap[p.path] = FIXTURE_GIT_STATUS
    })
    vi.mocked(tauriCommands.getGitStatuses).mockResolvedValue(statusMap)

    // Reset store
    useProjectsStore.setState({ projects: [], loaded: false })
  })

  it('renders one card per project and ignores pagination (25 projects, pageSize 10)', async () => {
    const screen = await renderGrid()

    // getByTestId returns a Locator; .all() returns Locator[].
    // 25 projects rendered — if pagination were applied only 10 would appear.
    const cards = await screen.getByTestId('project-card').all()
    expect(cards).toHaveLength(25)
  })

  it('applies column filter: only matching projects render', async () => {
    // language='typescript' → projects with even i (i%2===0) in 1..25 = 12
    const typescriptProjects = FIXTURE_PROJECTS.filter(
      (p) => p.language === 'typescript'
    )

    const screen = await renderGrid({
      initialColumnFilters: [{ id: 'language', value: ['typescript'] }],
    })

    const cards = await screen.getByTestId('project-card').all()
    expect(cards).toHaveLength(typescriptProjects.length)

    // Spot-check: a known rust-only project (odd index, unambiguous name) is absent.
    // "Project 25" is odd (i=25, 25%2=1 → rust) and won't prefix-match any other name.
    await expect
      .element(screen.getByText('Project 25', { exact: true }))
      .not.toBeInTheDocument()
  })

  it('shows empty state when no rows match', async () => {
    const screen = await renderGrid({
      initialColumnFilters: [
        { id: 'language', value: ['cobol'] }, // matches nothing
      ],
    })

    await expect
      .element(screen.getByText('No projects found.'))
      .toBeInTheDocument()

    // No project-card elements rendered
    const cards = await screen.getByTestId('project-card').all()
    expect(cards).toHaveLength(0)
  })

  it('calls getGitStatuses exactly once regardless of card count', async () => {
    await renderGrid()

    // Wait for the async query to settle
    await vi.waitFor(() => {
      expect(tauriCommands.getGitStatuses).toHaveBeenCalledTimes(1)
    })

    expect(tauriCommands.getGitStatuses).toHaveBeenCalledWith(
      expect.arrayContaining(FIXTURE_PROJECTS.map((p) => p.path))
    )
  })
})
