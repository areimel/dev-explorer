import { ConfirmDialog } from '@/components/confirm-dialog'

type RemoveTemplateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateName: string
  onConfirm: () => void
}

export function RemoveTemplateDialog({
  open,
  onOpenChange,
  templateName,
  onConfirm,
}: RemoveTemplateDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Remove template?'
      desc={`"${templateName}" will be permanently removed from your templates.`}
      confirmText='Remove'
      destructive
      handleConfirm={onConfirm}
    />
  )
}
