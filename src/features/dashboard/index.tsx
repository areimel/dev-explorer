import { useEffect } from 'react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useLaunchersStore } from '@/stores/launchers-store'
import { useProjectsStore } from '@/stores/projects-store'
import { useTemplatesStore } from '@/stores/templates-store'
import { ProjectsDialogs } from '@/features/projects/components/projects-dialogs'
import { ProjectsProvider } from '@/features/projects/components/projects-provider'
import { ActivityTracker } from './components/activity-tracker'
import { GitHubProfileCard } from './components/github-profile-card'
import { PinnedProjects } from './components/pinned-projects'
import { ProjectTemplates } from './components/project-templates'
import { RecentProjects } from './components/recent-projects'

export function Dashboard() {
  useEffect(() => {
    void useProjectsStore.getState().load()
    void useLaunchersStore.getState().load()
    void useTemplatesStore.getState().load()
  }, [])

  return (
    <ProjectsProvider>
      <Header>
        <h1 className='text-lg font-semibold'>Dashboard</h1>
        <div className='ms-auto flex items-center gap-2'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
        </div>
      </Header>

      <Main>
        <div className='grid gap-6 lg:grid-cols-3'>
          <div className='space-y-6 lg:col-span-2'>
            <PinnedProjects />
            <RecentProjects />
            <ProjectTemplates />
          </div>
          <div className='space-y-6'>
            <GitHubProfileCard />
            <ActivityTracker />
          </div>
        </div>
      </Main>

      <ProjectsDialogs />
    </ProjectsProvider>
  )
}
