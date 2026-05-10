import { useState } from 'react'
import { toast } from 'sonner'
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
import { useProjectsStore } from '@/stores/projects-store'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddManualProjectDialog({ open, onOpenChange }: Props) {
  const [path, setPath] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleClose() {
    setPath('')
    setDisplayName('')
    onOpenChange(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedPath = path.trim()
    if (!trimmedPath) return

    setIsLoading(true)
    try {
      const project = await useProjectsStore.getState().addManual(trimmedPath)
      const trimmedName = displayName.trim()
      if (trimmedName && trimmedName !== project.name) {
        await useProjectsStore.getState().rename(project.id, trimmedName)
      }
      toast.success('Project added successfully')
      handleClose()
    } catch {
      toast.error('Failed to add project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Add project manually</DialogTitle>
          <DialogDescription>
            Enter the absolute path to a local project folder.
          </DialogDescription>
        </DialogHeader>
        <form id='add-manual-form' onSubmit={(e) => void handleSubmit(e)}>
          <div className='space-y-4 py-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='project-path'>
                Path <span className='text-destructive'>*</span>
              </Label>
              <Input
                id='project-path'
                placeholder='C:\Users\Alec\Dev\my-project'
                value={path}
                onChange={(e) => setPath(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='project-name'>
                Display name{' '}
                <span className='text-muted-foreground text-xs'>(optional)</span>
              </Label>
              <Input
                id='project-name'
                placeholder='My Project'
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type='submit'
            form='add-manual-form'
            disabled={!path.trim() || isLoading}
          >
            Add project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
