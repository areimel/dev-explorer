import { type ColumnDef } from '@tanstack/react-table'
import type { Project } from '@/lib/tauri/types'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { ProjectActionsMenu } from './project-actions-menu'

export const projectsColumns: ColumnDef<Project>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-0.5'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-0.5'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row, table }) => {
      // Access the meta context to open the detail sheet on click
      const meta = table.options.meta as
        | { onRowClick?: (project: Project) => void }
        | undefined
      return (
        <button
          type='button'
          className='max-w-48 truncate text-start font-medium hover:underline focus:outline-none'
          onClick={() => meta?.onRowClick?.(row.original)}
        >
          {row.getValue('name')}
        </button>
      )
    },
  },
  {
    accessorKey: 'path',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Path' />
    ),
    cell: ({ row }) => {
      const path = row.getValue<string>('path')
      return (
        <span
          className='block max-w-72 truncate text-sm text-muted-foreground'
          title={path}
        >
          {path}
        </span>
      )
    },
  },
  {
    accessorKey: 'language',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Language' />
    ),
    cell: ({ row }) => {
      const lang = row.getValue<string | null>('language')
      if (!lang) return <span className='text-muted-foreground'>—</span>
      return <Badge variant='secondary'>{lang}</Badge>
    },
    filterFn: 'arrIncludesSome',
  },
  {
    accessorKey: 'source',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Source' />
    ),
    cell: ({ row }) => {
      const source = row.getValue<'scanned' | 'manual'>('source')
      return (
        <Badge variant={source === 'manual' ? 'outline' : 'default'}>
          {source === 'manual' ? 'Manual' : 'Scanned'}
        </Badge>
      )
    },
    filterFn: 'arrIncludesSome',
  },
  {
    accessorKey: 'scanRootId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Scan Root' />
    ),
    cell: ({ row }) => {
      const id = row.getValue<string | null>('scanRootId')
      if (!id) return <span className='text-muted-foreground'>—</span>
      return (
        <span
          className='block max-w-48 truncate text-sm text-muted-foreground'
          title={id}
        >
          {id}
        </span>
      )
    },
    filterFn: 'arrIncludesSome',
  },
  {
    accessorKey: 'lastModifiedMs',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Last Modified' />
    ),
    cell: ({ row }) => {
      const ms = row.getValue<number>('lastModifiedMs')
      const formatted = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(ms))
      return <span className='text-sm text-muted-foreground'>{formatted}</span>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ProjectActionsMenu project={row.original} />,
    enableHiding: false,
  },
]
