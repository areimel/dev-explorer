import { LayoutTemplate, MoreHorizontal, Pin, PinOff } from 'lucide-react'
import { useProjectsStore } from '@/stores/projects-store'
import { tauriCommands } from '@/lib/tauri/commands'
import type { Project } from '@/lib/tauri/types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProjects } from './projects-provider'

export function ProjectActionsMenu({
  project,
  className,
}: {
  project: Project
  className?: string
}) {
  const { setOpen, setCurrentRow } = useProjects()
  const isPinned = useProjectsStore((s) => s.pinnedIds.includes(project.id))
  const isTemplate = useProjectsStore((s) =>
    s.templateProjectIds.includes(project.id)
  )

  function togglePin() {
    void useProjectsStore.getState().togglePin(project.id)
  }

  function toggleTemplate() {
    void useProjectsStore.getState().toggleTemplateProject(project.id)
  }

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
        <Button variant='ghost' className={className ?? 'size-8 p-0'}>
          <span className='sr-only'>Open menu</span>
          <MoreHorizontal className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={openDetail}>Open detail</DropdownMenuItem>
        <DropdownMenuItem onClick={togglePin}>
          {isPinned ? (
            <>
              <PinOff className='size-4' />
              Unpin
            </>
          ) : (
            <>
              <Pin className='size-4' />
              Pin
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTemplate}>
          <LayoutTemplate className='size-4' />
          {isTemplate ? 'Remove template' : 'Mark as template'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openEditName}>Edit name</DropdownMenuItem>
        <DropdownMenuItem onClick={() => void reveal()}>
          Reveal in Explorer
        </DropdownMenuItem>
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
