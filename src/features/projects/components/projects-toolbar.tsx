import { useMemo } from 'react'
import { type Table } from '@tanstack/react-table'
import { FolderPlus, RefreshCw } from 'lucide-react'
import { useProjectsStore } from '@/stores/projects-store'
import { useScanRootsStore } from '@/stores/scan-roots-store'
import type { Project } from '@/lib/tauri/types'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DataTableToolbar } from '@/components/data-table'
import type { ViewMode } from '../hooks/use-view-mode'
import { useProjects } from './projects-provider'
import { ProjectsViewToggle } from './projects-view-toggle'

type ProjectsToolbarProps = {
  table: Table<Project>
  viewMode?: ViewMode
  onViewModeChange?: (m: ViewMode) => void
}

export function ProjectsToolbar({
  table,
  viewMode,
  onViewModeChange,
}: ProjectsToolbarProps) {
  const { setOpen } = useProjects()
  const projects = useProjectsStore((s) => s.projects)
  const rescanAll = useProjectsStore((s) => s.rescanAll)
  const roots = useScanRootsStore((s) => s.roots)

  const languageOptions = useMemo(() => {
    const langs = new Set(
      projects.map((p) => p.language).filter((l): l is string => l !== null)
    )
    return Array.from(langs).map((l) => ({ label: l, value: l }))
  }, [projects])

  const sourceOptions = useMemo(
    () => [
      { label: 'Scanned', value: 'scanned' },
      { label: 'Manual', value: 'manual' },
    ],
    []
  )

  const scanRootOptions = useMemo(
    () =>
      roots.map((r) => ({
        label: r.label ?? r.path,
        value: r.id,
      })),
    [roots]
  )

  return (
    <div className='flex items-center justify-between gap-2'>
      <div className='flex-1'>
        <DataTableToolbar
          table={table}
          searchPlaceholder='Filter projects...'
          filters={[
            {
              columnId: 'language',
              title: 'Language',
              options: languageOptions,
            },
            {
              columnId: 'source',
              title: 'Source',
              options: sourceOptions,
            },
            ...(scanRootOptions.length > 0
              ? [
                  {
                    columnId: 'scanRootId',
                    title: 'Scan Root',
                    options: scanRootOptions,
                  },
                ]
              : []),
          ]}
        />
      </div>
      <div className='flex shrink-0 items-center gap-2'>
        {viewMode != null && onViewModeChange != null && (
          <>
            <ProjectsViewToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
            <Separator orientation='vertical' className='h-6' />
          </>
        )}
        <Button
          variant='outline'
          size='sm'
          className='h-8'
          onClick={() => setOpen('add-manual')}
        >
          <FolderPlus className='mr-2 size-4' />
          Add project
        </Button>
        <Button
          variant='outline'
          size='sm'
          className='h-8'
          onClick={() => void rescanAll()}
        >
          <RefreshCw className='mr-2 size-4' />
          Re-scan all
        </Button>
      </div>
    </div>
  )
}
