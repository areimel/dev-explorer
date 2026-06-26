import type { Project } from '@/lib/tauri/types'
import { ProjectCard } from '@/features/projects/components/project-card'
import { useGitStatuses } from '@/features/projects/hooks/use-git-statuses'
import { useProjectCardsMeta } from '@/features/projects/hooks/use-project-cards-meta'

/**
 * Renders a responsive grid of ProjectCards, sourcing git status + card meta
 * from the shared project hooks. Used by the Pinned and Recent sections so the
 * card wiring lives in one place.
 */
export function ProjectCardGrid({ projects }: { projects: Project[] }) {
  const { data: gitStatuses, isLoading: gitLoading } = useGitStatuses()
  const { data: cardsMeta, isLoading: metaLoading } = useProjectCardsMeta()

  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {projects.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          gitStatus={gitStatuses?.[p.path]}
          gitLoading={gitLoading}
          cardMeta={cardsMeta?.[p.path]}
          metaLoading={metaLoading}
        />
      ))}
    </div>
  )
}
