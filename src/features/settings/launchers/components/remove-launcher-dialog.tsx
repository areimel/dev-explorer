import { ConfirmDialog } from '@/components/confirm-dialog'

type RemoveLauncherDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  launcherName: string
  onConfirm: () => void
}

export function RemoveLauncherDialog({
  open,
  onOpenChange,
  launcherName,
  onConfirm,
}: RemoveLauncherDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Remove launcher?'
      desc={`"${launcherName}" will be permanently removed from your launcher list.`}
      confirmText='Remove'
      destructive
      handleConfirm={onConfirm}
    />
  )
}
