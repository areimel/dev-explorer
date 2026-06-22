import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useProjectsStore } from '@/stores/projects-store'
import type { Project } from '@/lib/tauri/types'
import { ProjectsProvider } from '@/features/projects/components/projects-provider'
import { PinnedProjects } from './pinned-projects'

vi.mock('@/lib/tauri/commands')
vi.mock('@/lib/tauri/db')

function makeProject(id: string, name: string): Project {
  return {
    id,
    path: `C:\\Dev\\${name}`,
    name,
    source: 'scanned',
    scanRootId: null,
    language: 'TypeScript',
    manifests: [],
    lastModifiedMs: Date.now(),
  }
}

function renderPinned() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectsProvider>
        <PinnedProjects />
      </ProjectsProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  useProjectsStore.setState({
    projects: [makeProject('a', 'alpha'), makeProject('b', 'beta')],
    pinnedIds: [],
    recentIds: [],
    loaded: true,
  })
})

afterEach(() => {
  useProjectsStore.setState({ projects: [], pinnedIds: [], recentIds: [] })
})

describe('PinnedProjects', () => {
  it('shows the empty state when nothing is pinned', async () => {
    const screen = await renderPinned()
    await expect
      .element(screen.getByText(/pin a project/i))
      .toBeInTheDocument()
  })

  it('renders only pinned projects', async () => {
    useProjectsStore.setState({ pinnedIds: ['a'] })
    const screen = await renderPinned()
    await expect
      .element(screen.getByRole('button', { name: /alpha/i }))
      .toBeInTheDocument()
    expect(screen.container.textContent).not.toContain('beta')
  })
})
