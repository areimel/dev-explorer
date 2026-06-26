import { useEffect, useState } from 'react'

import { Package, Pencil, Trash2 } from 'lucide-react'

import { useTemplatesStore } from '@/stores/templates-store'
import type { Template } from '@/lib/tauri/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { ContentSection } from '../components/content-section'
import { RemoveTemplateDialog } from './components/remove-template-dialog'
import { TemplateFormDialog } from './components/template-form-dialog'

export function SettingsTemplates() {
  const templates = useTemplatesStore((s) => s.templates)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editTarget, setEditTarget] = useState<Template | undefined>(undefined)
  const [removeTarget, setRemoveTarget] = useState<Template | null>(null)

  useEffect(() => {
    void useTemplatesStore.getState().load()
  }, [])

  const handleAdd = () => {
    setFormMode('create')
    setEditTarget(undefined)
    setFormOpen(true)
  }

  const handleEdit = (template: Template) => {
    setFormMode('edit')
    setEditTarget(template)
    setFormOpen(true)
  }

  const handleConfirmRemove = async () => {
    if (!removeTarget) return
    await useTemplatesStore.getState().remove(removeTarget.id)
    setRemoveTarget(null)
  }

  return (
    <ContentSection
      title='Templates'
      desc='Starter repositories shown on the dashboard with a one-click git clone command.'
    >
      <div className='space-y-4'>
        <div className='flex justify-end'>
          <Button size='sm' onClick={handleAdd}>
            Add template
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-10 text-muted-foreground'>
            <Package className='size-8 opacity-40' />
            <p className='text-sm'>No templates configured.</p>
          </div>
        ) : (
          <ul className='space-y-2'>
            {templates.map((template) => (
              <li
                key={template.id}
                className='flex items-center gap-3 rounded-lg border bg-card p-3'
              >
                <Package className='size-4 shrink-0 text-muted-foreground' />

                <div className='min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <p className='truncate text-sm font-medium'>
                      {template.name}
                    </p>
                    {template.language && (
                      <Badge variant='secondary'>{template.language}</Badge>
                    )}
                  </div>
                  <p className='truncate font-mono text-xs text-muted-foreground'>
                    {template.repoUrl}
                  </p>
                </div>

                <div className='flex shrink-0 gap-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleEdit(template)}
                    aria-label='Edit template'
                  >
                    <Pencil className='size-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-destructive hover:text-destructive'
                    onClick={() => setRemoveTarget(template)}
                    aria-label='Remove template'
                  >
                    <Trash2 className='size-4' />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <TemplateFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          template={editTarget}
        />

        <RemoveTemplateDialog
          open={removeTarget !== null}
          onOpenChange={(open) => {
            if (!open) setRemoveTarget(null)
          }}
          templateName={removeTarget?.name ?? ''}
          onConfirm={() => {
            void handleConfirmRemove()
          }}
        />
      </div>
    </ContentSection>
  )
}
