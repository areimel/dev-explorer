import { useEffect, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useProjectsStore } from '@/stores/projects-store'
import type { Project } from '@/lib/tauri/types'
import { cn } from '@/lib/utils'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { DataTablePagination } from '@/components/data-table'
import { useViewMode } from '../hooks/use-view-mode'
import { projectsColumns } from './projects-columns'
import { ProjectsGrid } from './projects-grid'
import { useProjects } from './projects-provider'
import { ProjectsTableView } from './projects-table'
import { ProjectsToolbar } from './projects-toolbar'

const route = getRouteApi('/_authenticated/projects/')

export function ProjectsView() {
  const projects = useProjectsStore((s) => s.projects)
  const { setOpen, setCurrentRow } = useProjects()

  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { viewMode, setViewMode } = useViewMode({ search, navigate })

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 20 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'language', searchKey: 'language', type: 'array' },
      { columnId: 'source', searchKey: 'source', type: 'array' },
      { columnId: 'scanRootId', searchKey: 'scanRootId', type: 'array' },
    ],
  })

  function onRowClick(project: Project) {
    setCurrentRow(project)
    setOpen('detail')
  }

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: projects,
    columns: projectsColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    meta: { onRowClick },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const name = String(row.getValue('name')).toLowerCase()
      const path = String(row.getValue('path')).toLowerCase()
      const search = String(filterValue).toLowerCase()
      return name.includes(search) || path.includes(search)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  })

  const pageCount = table.getPageCount()
  useEffect(() => {
    if (viewMode === 'table') ensurePageInRange(pageCount)
  }, [pageCount, ensurePageInRange, viewMode])

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-4'
      )}
    >
      <ProjectsToolbar
        table={table}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      {viewMode === 'grid' ? (
        <ProjectsGrid table={table} />
      ) : (
        <>
          <ProjectsTableView table={table} />
          <DataTablePagination table={table} className='mt-auto' />
        </>
      )}
    </div>
  )
}
