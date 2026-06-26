import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useProjectsStore } from '@/stores/projects-store'
import { useTemplatesStore } from '@/stores/templates-store'
import type { Project } from '@/lib/tauri/types'
import { ProjectsProvider } from '@/features/projects/components/projects-provider'
import { ProjectTemplates } from './project-templates'

vi.mock('@/lib/tauri/commands')
vi.mock('@/lib/tauri/db')

// The section renders router <Link>s; render them as plain anchors so the
// component can be tested without a full router context.
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    Link: ({ to, children }: { to: string; children: ReactNode }) => (
      <a href={to}>{children}</a>
    ),
  }
})

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

function renderTemplates() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectsProvider>
        <ProjectTemplates />
      </ProjectsProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  // Mark templates store loaded so the section's load() effect is a no-op.
  useTemplatesStore.setState({ templates: [], loaded: true })
  useProjectsStore.setState({
    projects: [makeProject('a', 'alpha'), makeProject('b', 'beta')],
    pinnedIds: [],
    templateProjectIds: [],
    recentIds: [],
    loaded: true,
  })
})

afterEach(() => {
  useProjectsStore.setState({
    projects: [],
    pinnedIds: [],
    templateProjectIds: [],
    recentIds: [],
  })
  useTemplatesStore.setState({ templates: [], loaded: false })
})

describe('ProjectTemplates', () => {
  it('shows the empty state when nothing is flagged or configured', async () => {
    const screen = await renderTemplates()
    await expect
      .element(screen.getByText(/no templates yet/i))
      .toBeInTheDocument()
  })

  it('renders only projects flagged as templates', async () => {
    useProjectsStore.setState({ templateProjectIds: ['a'] })
    const screen = await renderTemplates()
    await expect
      .element(screen.getByRole('button', { name: /alpha/i }))
      .toBeInTheDocument()
    expect(screen.container.textContent).not.toContain('beta')
  })
})
