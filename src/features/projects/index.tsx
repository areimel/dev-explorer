import { useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { useLaunchersStore } from '@/stores/launchers-store'
import { useProjectsStore } from '@/stores/projects-store'
import { useScanRootsStore } from '@/stores/scan-roots-store'
import { ProjectsDialogs } from './components/projects-dialogs'
import { ProjectsProvider } from './components/projects-provider'
import { ProjectsView } from './components/projects-view'

export function Projects() {
  const projectsLoaded = useProjectsStore((s) => s.loaded)
  const scanRootsLoaded = useScanRootsStore((s) => s.loaded)
  const launchersLoaded = useLaunchersStore((s) => s.loaded)

  useEffect(() => {
    void useProjectsStore.getState().load()
    void useScanRootsStore.getState().load()
    void useLaunchersStore.getState().load()
  }, [])

  const isLoading = !projectsLoaded || !scanRootsLoaded || !launchersLoaded

  return (
    <ProjectsProvider>
      <Header fixed>
        <div className='flex flex-1 items-center justify-between'>
          <h1 className='text-lg font-semibold'>Projects</h1>
          <div className='flex items-center gap-2'>
            <ThemeSwitch />
          </div>
        </div>
      </Header>

      <Main fixed>
        {isLoading ? (
          <div className='flex flex-1 items-center justify-center text-muted-foreground'>
            Loading projects…
          </div>
        ) : (
          <ProjectsView />
        )}
      </Main>

      <ProjectsDialogs />
    </ProjectsProvider>
  )
}
