import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { Project } from '@/lib/tauri/types'
import { useProjectsStore } from '@/stores/projects-store'

type Props = {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
  onRemoved?: () => void
}

export function RemoveProjectDialog({
  project,
  open,
  onOpenChange,
  onRemoved,
}: Props) {
  function handleConfirm() {
    useProjectsStore
      .getState()
      .remove(project.id)
      .then(() => {
        toast.success(`"${project.name}" removed`)
        onRemoved?.()
      })
      .catch(() => toast.error('Failed to remove project'))
    onOpenChange(false)
  }

  return (
    <ConfirmDialog
      destructive
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleConfirm}
      className='max-w-md'
      title={`Remove "${project.name}"?`}
      desc={
        <>
          This will remove <strong>{project.name}</strong> from Dev Explorer.
          The folder on disk will not be deleted.
        </>
      }
      confirmText='Remove'
    />
  )
}
