import { useEffect, useState } from 'react'

import { FolderTree, RefreshCw, Trash2 } from 'lucide-react'

import { useProjectsStore } from '@/stores/projects-store'
import { useScanRootsStore } from '@/stores/scan-roots-store'
import type { ScanRoot } from '@/lib/tauri/types'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'

import { ContentSection } from '../components/content-section'
import { AddScanRootDialog } from './components/add-scan-root-dialog'

export function SettingsScanRoots() {
  const roots = useScanRootsStore((s) => s.roots)
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<ScanRoot | null>(null)
  const [rescanning, setRescanning] = useState<string | null>(null)

  useEffect(() => {
    void useScanRootsStore.getState().load()
  }, [])

  const handleRescan = async (root: ScanRoot) => {
    setRescanning(root.id)
    try {
      await useProjectsStore.getState().rescanRoot(root.id)
    } finally {
      setRescanning(null)
    }
  }

  const handleConfirmRemove = async () => {
    if (!removeTarget) return
    await useScanRootsStore.getState().remove(removeTarget.id)
    setRemoveTarget(null)
  }

  return (
    <ContentSection
      title='Scan Roots'
      desc='Folders Dev Explorer indexes for projects.'
    >
      <div className='space-y-4'>
        <div className='flex justify-end'>
          <Button size='sm' onClick={() => setAddOpen(true)}>
            Add scan root
          </Button>
        </div>

        {roots.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-10 text-muted-foreground'>
            <FolderTree className='size-8 opacity-40' />
            <p className='text-sm'>No scan roots configured.</p>
            <p className='text-xs'>Add a folder to start indexing projects.</p>
          </div>
        ) : (
          <ul className='space-y-2'>
            {roots.map((root) => (
              <li
                key={root.id}
                className='flex items-center gap-3 rounded-lg border bg-card p-3'
              >
                <FolderTree className='size-4 shrink-0 text-muted-foreground' />
                <div className='min-w-0 flex-1'>
                  {root.label && (
                    <p className='truncate text-sm font-medium'>{root.label}</p>
                  )}
                  <p className='truncate font-mono text-xs text-muted-foreground'>
                    {root.path}
                  </p>
                </div>
                <div className='flex shrink-0 gap-1'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleRescan(root)}
                    disabled={rescanning === root.id}
                  >
                    <RefreshCw
                      className={`me-1.5 size-3.5 ${rescanning === root.id ? 'animate-spin' : ''}`}
                    />
                    Re-scan
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-destructive hover:text-destructive'
                    onClick={() => setRemoveTarget(root)}
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <AddScanRootDialog open={addOpen} onOpenChange={setAddOpen} />

        <ConfirmDialog
          open={removeTarget !== null}
          onOpenChange={(open) => { if (!open) setRemoveTarget(null) }}
          title='Remove scan root?'
          desc={
            removeTarget
              ? `"${removeTarget.label ?? removeTarget.path}" will be removed. Projects discovered from this root will remain in your list but will no longer be re-scanned.`
              : ''
          }
          confirmText='Remove'
          destructive
          handleConfirm={() => { void handleConfirmRemove() }}
        />
      </div>
    </ContentSection>
  )
}
