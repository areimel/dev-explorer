import { type Table } from '@tanstack/react-table'
import type { Project } from '@/lib/tauri/types'
import { useGitStatuses } from '../hooks/use-git-statuses'
import { useProjectCardsMeta } from '../hooks/use-project-cards-meta'
import { ProjectCard } from './project-card'

type ProjectsGridProps = {
  table: Table<Project>
}

export function ProjectsGrid({ table }: ProjectsGridProps) {
  const { data: gitStatuses, isLoading: gitLoading } = useGitStatuses()
  const { data: cardsMeta, isLoading: metaLoading } = useProjectCardsMeta()

  const rows = table.getPrePaginationRowModel().rows

  if (rows.length === 0) {
    return (
      <div className='flex h-32 items-center justify-center rounded-none border border-dashed text-muted-foreground'>
        <span className='font-mono text-xs tracking-wider uppercase'>
          No projects found.
        </span>
      </div>
    )
  }

  return (
    <div className='min-h-0 flex-1 overflow-y-auto border-t'>
      <div className='grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 lg:grid-cols-3'>
        {rows.map((row) => (
          <ProjectCard
            key={row.original.id}
            project={row.original}
            gitStatus={gitStatuses?.[row.original.path]}
            gitLoading={gitLoading}
            cardMeta={cardsMeta?.[row.original.path]}
            metaLoading={metaLoading}
          />
        ))}
      </div>
    </div>
  )
}
