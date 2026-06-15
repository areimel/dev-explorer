import { type Table } from '@tanstack/react-table'
import type { Project } from '@/lib/tauri/types'
import { useGitStatuses } from '../hooks/use-git-statuses'
import { ProjectCard } from './project-card'

type ProjectsGridProps = {
  table: Table<Project>
}

export function ProjectsGrid({ table }: ProjectsGridProps) {
  const { data: gitStatuses, isLoading: gitLoading } = useGitStatuses()

  const rows = table.getPrePaginationRowModel().rows

  if (rows.length === 0) {
    return (
      <div className='flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground'>
        No projects found.
      </div>
    )
  }

  return (
    <div className='min-h-0 flex-1 overflow-y-auto'>
      <div className='grid grid-cols-1 gap-4 pb-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
        {rows.map((row) => (
          <ProjectCard
            key={row.original.id}
            project={row.original}
            gitStatus={gitStatuses?.[row.original.path]}
            gitLoading={gitLoading}
          />
        ))}
      </div>
    </div>
  )
}
