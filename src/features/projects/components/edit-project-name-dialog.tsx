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
import type { Project } from '@/lib/tauri/types'
import { useProjectsStore } from '@/stores/projects-store'

type Props = {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectNameDialog({ project, open, onOpenChange }: Props) {
  const [name, setName] = useState(project.name)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === project.name) {
      onOpenChange(false)
      return
    }
    setIsLoading(true)
    try {
      await useProjectsStore.getState().rename(project.id, trimmed)
      toast.success('Project renamed')
      onOpenChange(false)
    } catch {
      toast.error('Failed to rename project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit project name</DialogTitle>
          <DialogDescription>Change the display name for this project.</DialogDescription>
        </DialogHeader>
        <form id='edit-name-form' onSubmit={(e) => void handleSubmit(e)}>
          <div className='py-2 space-y-1.5'>
            <Label htmlFor='edit-name'>Name</Label>
            <Input
              id='edit-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
        </form>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            form='edit-name-form'
            disabled={!name.trim() || isLoading}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
