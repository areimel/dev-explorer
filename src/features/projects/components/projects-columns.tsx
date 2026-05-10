import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTableColumnHeader } from '@/components/data-table'
import { tauriCommands } from '@/lib/tauri/commands'
import type { Project } from '@/lib/tauri/types'
import { useProjects } from './projects-provider'

// eslint-disable-next-line react-refresh/only-export-components
function ActionsCell({ project }: { project: Project }) {
  const { setOpen, setCurrentRow } = useProjects()

  function openDetail() {
    setCurrentRow(project)
    setOpen('detail')
  }

  function openEditName() {
    setCurrentRow(project)
    setOpen('edit-name')
  }

  function openRemove() {
    setCurrentRow(project)
    setOpen('remove')
  }

  async function reveal() {
    await tauriCommands.revealInExplorer(project.path)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='size-8 p-0'>
          <span className='sr-only'>Open menu</span>
          <MoreHorizontal className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={openDetail}>Open detail</DropdownMenuItem>
        <DropdownMenuItem onClick={openEditName}>Edit name</DropdownMenuItem>
        <DropdownMenuItem onClick={reveal}>Reveal in Explorer</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={openRemove}
          className='text-destructive focus:text-destructive'
        >
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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
          className='max-w-48 truncate font-medium text-start hover:underline focus:outline-none'
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
        <span className='text-sm text-muted-foreground truncate block max-w-48' title={id}>
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
    cell: ({ row }) => <ActionsCell project={row.original} />,
    enableHiding: false,
  },
]
