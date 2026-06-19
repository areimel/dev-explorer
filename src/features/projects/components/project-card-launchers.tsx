import { MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { useLaunchersStore } from '@/stores/launchers-store'
import { tauriCommands } from '@/lib/tauri/commands'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LauncherButton, LauncherIcon } from './launcher-button'

export function ProjectCardLaunchers({ projectPath }: { projectPath: string }) {
  const launchers = useLaunchersStore((s) => s.launchers)

  if (launchers.length === 0) return null

  const primary = launchers.slice(0, 3)
  const overflow = launchers.slice(3)

  async function handleOverflowLaunch(commandTemplate: string, name: string) {
    await tauriCommands.openWithLauncher(projectPath, commandTemplate)
    toast.success(`Opened with ${name}`)
  }

  return (
    <div className='flex flex-col gap-2'>
      {primary.map((launcher) => (
        <LauncherButton
          key={launcher.id}
          launcher={launcher}
          projectPath={projectPath}
          variant='secondary'
          className='flex h-9 w-full items-center justify-start gap-2 rounded-none truncate'
        />
      ))}
      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='outline'
              className='h-9 w-full justify-start gap-2 rounded-none'
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className='size-4' />
              <span>More…</span>
              <span className='sr-only'>More launchers</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {overflow.map((launcher) => (
              <DropdownMenuItem
                key={launcher.id}
                onSelect={() =>
                  void handleOverflowLaunch(
                    launcher.commandTemplate,
                    launcher.name
                  )
                }
                className='flex items-center gap-2'
              >
                <LauncherIcon name={launcher.icon} />
                {launcher.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
