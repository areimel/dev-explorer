import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { useLaunchersStore } from '@/stores/launchers-store'
import { tauriCommands } from '@/lib/tauri/commands'
import type { GitStatus, Launcher, Project } from '@/lib/tauri/types'
import { ProjectCard } from './project-card'
import { ProjectsProvider, useProjects } from './projects-provider'

vi.mock('@/lib/tauri/commands')
vi.mock('@/lib/tauri/store')

const MOCK_PROJECT: Project = {
  id: 'proj-1',
  path: 'C:\\Dev\\my-app',
  name: 'my-app',
  source: 'scanned',
  scanRootId: 'root-1',
  language: 'TypeScript',
  manifests: ['package.json', 'tsconfig.json', 'vite.config.ts', '.eslintrc'],
  lastModifiedMs: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
}

const MOCK_LAUNCHERS: Launcher[] = [
  { id: 'l1', name: 'VS Code', icon: 'Code', commandTemplate: 'code "{path}"' },
  {
    id: 'l2',
    name: 'Terminal',
    icon: 'Terminal',
    commandTemplate: 'wt -d "{path}"',
  },
  {
    id: 'l3',
    name: 'Explorer',
    icon: 'Folder',
    commandTemplate: 'explorer "{path}"',
  },
  {
    id: 'l4',
    name: 'Cursor',
    icon: 'MousePointer',
    commandTemplate: 'cursor "{path}"',
  },
]

const GIT_DIRTY: GitStatus = {
  isRepo: true,
  branch: 'main',
  isDirty: true,
  detached: false,
}
const GIT_CLEAN: GitStatus = {
  isRepo: true,
  branch: 'main',
  isDirty: false,
  detached: false,
}
const GIT_NOT_REPO: GitStatus = {
  isRepo: false,
  branch: null,
  isDirty: false,
  detached: false,
}

async function renderCard(
  props: {
    project?: Project
    gitStatus?: GitStatus | undefined
    gitLoading?: boolean
  } = {}
) {
  const {
    project = MOCK_PROJECT,
    gitStatus = GIT_CLEAN,
    gitLoading = false,
  } = props
  return await render(
    <ProjectsProvider>
      <ProjectCard
        project={project}
        gitStatus={gitStatus}
        gitLoading={gitLoading}
      />
    </ProjectsProvider>
  )
}

describe('ProjectCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(tauriCommands.openWithLauncher).mockResolvedValue(undefined)
    useLaunchersStore.setState({ launchers: MOCK_LAUNCHERS, loaded: true })
  })

  it('renders name, path, language badge, source badge, manifest badges, relative time', async () => {
    const screen = await renderCard()

    // Name is in a span (not the path paragraph which also contains 'my-app')
    await expect
      .element(screen.getByRole('button', { name: /my-app/i }))
      .toBeInTheDocument()
    // Path is in font-mono paragraph
    await expect
      .element(screen.getByText('C:\\Dev\\my-app', { exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('TypeScript', { exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('scanned', { exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('package.json', { exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('tsconfig.json', { exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByText('vite.config.ts', { exact: true }))
      .toBeInTheDocument()
    // 4th manifest is overflowed
    await expect
      .element(screen.getByText('+1', { exact: true }))
      .toBeInTheDocument()
    // relative time — matches "ago" suffix
    await expect.element(screen.getByText(/ago/i)).toBeInTheDocument()
  })

  describe('git segment', () => {
    it('shows branch when isDirty', async () => {
      const screen = await renderCard({ gitStatus: GIT_DIRTY })

      // Branch name in font-mono span
      await expect
        .element(screen.getByText('main', { exact: true }))
        .toBeInTheDocument()
    })

    it('shows skeleton while gitLoading and hides branch text', async () => {
      const screen = await renderCard({
        gitLoading: true,
        gitStatus: undefined,
      })

      // Branch text should not be present while loading
      await expect
        .element(screen.getByText('main', { exact: true }))
        .not.toBeInTheDocument()
    })

    it('renders no git segment when isRepo is false', async () => {
      const screen = await renderCard({
        gitStatus: GIT_NOT_REPO,
        gitLoading: false,
      })

      // GitBranch icon + branch text should be absent
      await expect
        .element(screen.getByText('main', { exact: true }))
        .not.toBeInTheDocument()
    })
  })

  it('clicking a launcher button calls openWithLauncher', async () => {
    const { userEvent } = await import('vitest/browser')

    const screen = await renderCard()

    // Use exact name to avoid matching the card's role=button whose accessible
    // name contains all its inner text (including "VS Code")
    const vsCodeBtn = screen.getByRole('button', {
      name: 'VS Code',
      exact: true,
    })
    await userEvent.click(vsCodeBtn)

    expect(tauriCommands.openWithLauncher).toHaveBeenCalledWith(
      MOCK_PROJECT.path,
      MOCK_LAUNCHERS[0].commandTemplate
    )
  })

  it('with 4 launchers, shows exactly 3 primary buttons and overflow menu button', async () => {
    const screen = await renderCard()

    await expect
      .element(screen.getByRole('button', { name: 'VS Code', exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Terminal', exact: true }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('button', { name: 'Explorer', exact: true }))
      .toBeInTheDocument()
    // Overflow button (MoreHorizontal) — use exact name to avoid matching card button
    await expect
      .element(
        screen.getByRole('button', { name: 'More launchers', exact: true })
      )
      .toBeInTheDocument()
    // The 4th launcher (Cursor) should NOT be a visible primary button
    await expect
      .element(screen.getByRole('button', { name: 'Cursor', exact: true }))
      .not.toBeInTheDocument()
  })

  it('clicking the card body opens the detail sheet', async () => {
    const { userEvent } = await import('vitest/browser')

    // Probe component that reads from context
    function OpenProbe() {
      const { open } = useProjects()
      return <div data-testid='open-state'>{open ?? 'null'}</div>
    }

    const screen = await render(
      <ProjectsProvider>
        <ProjectCard
          project={MOCK_PROJECT}
          gitStatus={GIT_CLEAN}
          gitLoading={false}
        />
        <OpenProbe />
      </ProjectsProvider>
    )

    await expect
      .element(screen.getByTestId('open-state'))
      .toHaveTextContent('null')

    // Click the card itself (it has role=button)
    const card = screen.getByRole('button', { name: /my-app/i })
    await userEvent.click(card)

    await expect
      .element(screen.getByTestId('open-state'))
      .toHaveTextContent('detail')
  })
})
