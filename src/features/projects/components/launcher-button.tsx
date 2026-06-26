import * as Icons from 'lucide-react'
import { toast } from 'sonner'
import { useProjectsStore } from '@/stores/projects-store'
import { tauriCommands } from '@/lib/tauri/commands'
import type { Launcher } from '@/lib/tauri/types'
import { Button } from '@/components/ui/button'

export function LauncherIcon({ name }: { name: string }) {
  const Icon = (Icons as Record<string, unknown>)[name] as
    | React.ComponentType<{ className?: string }>
    | undefined
  const Resolved = Icon ?? Icons.Rocket
  return <Resolved className='size-4' />
}

export function LauncherButton({
  launcher,
  projectPath,
  variant = 'outline',
  className,
}: {
  launcher: Launcher
  projectPath: string
  variant?: React.ComponentProps<typeof Button>['variant']
  className?: string
}) {
  async function handleClick() {
    await tauriCommands.openWithLauncher(projectPath, launcher.commandTemplate)
    void useProjectsStore.getState().recordOpenByPath(projectPath)
    toast.success(`Opened with ${launcher.name}`)
  }

  return (
    <Button
      variant={variant}
      size='sm'
      className={className ?? 'flex items-center gap-2'}
      onClick={() => void handleClick()}
    >
      <LauncherIcon name={launcher.icon} />
      {launcher.name}
    </Button>
  )
}
