import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { useProjectsStore } from '@/stores/projects-store'
import { DashboardSection } from './dashboard-section'
import { ProjectCardGrid } from './project-card-grid'

const RECENT_DISPLAY_LIMIT = 6

export function RecentProjects() {
  const projects = useProjectsStore((s) => s.projects)
  const recentIds = useProjectsStore((s) => s.recentIds)

  // recentIds is ordered most-recent-first; preserve that order and drop ids
  // whose project no longer exists.
  const recent = useMemo(() => {
    const byId = new Map(projects.map((p) => [p.id, p]))
    return recentIds
      .map((id) => byId.get(id))
      .filter((p): p is (typeof projects)[number] => p !== undefined)
      .slice(0, RECENT_DISPLAY_LIMIT)
  }, [projects, recentIds])

  return (
    <DashboardSection title='Recent Projects' icon={Clock}>
      {recent.length === 0 ? (
        <p className='py-4 text-center text-sm text-muted-foreground'>
          Projects you open will show up here.
        </p>
      ) : (
        <ProjectCardGrid projects={recent} />
      )}
    </DashboardSection>
  )
}
