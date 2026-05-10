import { useState } from 'react'

import { useProjectsStore } from '@/stores/projects-store'
import { useScanRootsStore } from '@/stores/scan-roots-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type AddScanRootDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddScanRootDialog({ open, onOpenChange }: AddScanRootDialogProps) {
  const [path, setPath] = useState('')
  const [label, setLabel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!path.trim()) return
    setIsSubmitting(true)
    try {
      const root = await useScanRootsStore.getState().add(path.trim(), label.trim() || undefined)
      await useProjectsStore.getState().rescanRoot(root.id)
      setPath('')
      setLabel('')
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add Scan Root</DialogTitle>
          <DialogDescription>
            Enter the path to a folder containing your projects. Dev Explorer
            will index all projects found inside it.
          </DialogDescription>
        </DialogHeader>
        <form id='add-scan-root-form' onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='scan-root-path'>Folder path</Label>
            <Input
              id='scan-root-path'
              placeholder='C:\Users\Alec\Dev\personal'
              value={path}
              onChange={(e) => setPath(e.target.value)}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='scan-root-label'>
              Label{' '}
              <span className='text-muted-foreground font-normal'>(optional)</span>
            </Label>
            <Input
              id='scan-root-label'
              placeholder='Personal projects'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
        </form>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            form='add-scan-root-form'
            disabled={!path.trim() || isSubmitting}
          >
            {isSubmitting ? 'Adding…' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
