import { useEffect, useState } from 'react'

import * as Icons from 'lucide-react'
import { ChevronDown, ChevronUp, Pencil, Rocket, Trash2 } from 'lucide-react'

import { useLaunchersStore } from '@/stores/launchers-store'
import type { Launcher } from '@/lib/tauri/types'
import { Button } from '@/components/ui/button'

import { ContentSection } from '../components/content-section'
import { LauncherFormDialog } from './components/launcher-form-dialog'
import { RemoveLauncherDialog } from './components/remove-launcher-dialog'

function LauncherIcon({ name }: { name: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const I = (Icons as any)[name] ?? Icons.Rocket
  return <I className='size-4' />
}

export function SettingsLaunchers() {
  const launchers = useLaunchersStore((s) => s.launchers)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editTarget, setEditTarget] = useState<Launcher | undefined>(undefined)
  const [removeTarget, setRemoveTarget] = useState<Launcher | null>(null)

  useEffect(() => {
    void useLaunchersStore.getState().load()
  }, [])

  const handleAdd = () => {
    setFormMode('create')
    setEditTarget(undefined)
    setFormOpen(true)
  }

  const handleEdit = (launcher: Launcher) => {
    setFormMode('edit')
    setEditTarget(launcher)
    setFormOpen(true)
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const ids = launchers.map((l) => l.id)
    ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
    await useLaunchersStore.getState().reorder(ids)
  }

  const handleMoveDown = async (index: number) => {
    if (index === launchers.length - 1) return
    const ids = launchers.map((l) => l.id)
    ;[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]
    await useLaunchersStore.getState().reorder(ids)
  }

  const handleConfirmRemove = async () => {
    if (!removeTarget) return
    await useLaunchersStore.getState().remove(removeTarget.id)
    setRemoveTarget(null)
  }

  return (
    <ContentSection
      title='Launchers'
      desc='Configure how to open projects in external tools.'
    >
      <div className='space-y-4'>
        <div className='flex justify-end'>
          <Button size='sm' onClick={handleAdd}>
            Add launcher
          </Button>
        </div>

        {launchers.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-10 text-muted-foreground'>
            <Rocket className='size-8 opacity-40' />
            <p className='text-sm'>No launchers configured.</p>
          </div>
        ) : (
          <ul className='space-y-2'>
            {launchers.map((launcher, index) => (
              <li
                key={launcher.id}
                className='flex items-center gap-3 rounded-lg border bg-card p-3'
              >
                <div className='flex flex-col gap-0.5'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                    aria-label='Move up'
                  >
                    <ChevronUp className='size-3.5' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-6'
                    disabled={index === launchers.length - 1}
                    onClick={() => handleMoveDown(index)}
                    aria-label='Move down'
                  >
                    <ChevronDown className='size-3.5' />
                  </Button>
                </div>

                <span className='text-muted-foreground'>
                  <LauncherIcon name={launcher.icon} />
                </span>

                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{launcher.name}</p>
                  <p className='truncate font-mono text-xs text-muted-foreground'>
                    {launcher.commandTemplate}
                  </p>
                </div>

                <div className='flex shrink-0 gap-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleEdit(launcher)}
                    aria-label='Edit launcher'
                  >
                    <Pencil className='size-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-destructive hover:text-destructive'
                    onClick={() => setRemoveTarget(launcher)}
                    aria-label='Remove launcher'
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <LauncherFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          launcher={editTarget}
        />

        <RemoveLauncherDialog
          open={removeTarget !== null}
          onOpenChange={(open) => { if (!open) setRemoveTarget(null) }}
          launcherName={removeTarget?.name ?? ''}
          onConfirm={() => { void handleConfirmRemove() }}
        />
      </div>
    </ContentSection>
  )
}
