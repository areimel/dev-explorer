import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useProjectsStore } from '@/stores/projects-store'
import type { Project } from '@/lib/tauri/types'
import { ProjectsProvider } from '@/features/projects/components/projects-provider'
import { RecentProjects } from './recent-projects'

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

function renderRecent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectsProvider>
        <RecentProjects />
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

describe('RecentProjects', () => {
  it('shows the empty state when nothing was opened', async () => {
    const screen = await renderRecent()
    await expect
      .element(screen.getByText(/projects you open/i))
      .toBeInTheDocument()
  })

  it('renders recent projects in recentIds order', async () => {
    useProjectsStore.setState({ recentIds: ['b', 'a'] })
    const screen = await renderRecent()
    await expect
      .element(screen.getByRole('button', { name: /beta/i }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: /alpha/i }))
      .toBeInTheDocument()
  })
})
