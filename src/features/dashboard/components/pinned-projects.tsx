import { useMemo } from 'react'
import { Pin } from 'lucide-react'
import { useProjectsStore } from '@/stores/projects-store'
import { DashboardSection } from './dashboard-section'
import { ProjectCardGrid } from './project-card-grid'

export function PinnedProjects() {
  const projects = useProjectsStore((s) => s.projects)
  const pinnedIds = useProjectsStore((s) => s.pinnedIds)

  const pinned = useMemo(() => {
    const set = new Set(pinnedIds)
    return projects.filter((p) => set.has(p.id))
  }, [projects, pinnedIds])

  return (
    <DashboardSection title='Pinned Projects' icon={Pin}>
      {pinned.length === 0 ? (
        <p className='py-4 text-center text-sm text-muted-foreground'>
          Pin a project from its menu to keep it here.
        </p>
      ) : (
        <ProjectCardGrid projects={pinned} />
      )}
    </DashboardSection>
  )
}
