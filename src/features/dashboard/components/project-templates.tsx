import { useEffect } from 'react'
import { Package } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTemplatesStore } from '@/stores/templates-store'
import { Button } from '@/components/ui/button'
import { DashboardSection } from './dashboard-section'
import { TemplateCard } from './template-card'

export function ProjectTemplates() {
  const templates = useTemplatesStore((s) => s.templates)

  useEffect(() => {
    void useTemplatesStore.getState().load()
  }, [])

  return (
    <DashboardSection
      title='Project Templates'
      icon={Package}
      action={
        <Button variant='ghost' size='sm' asChild>
          <Link to='/settings/templates'>Manage</Link>
        </Button>
      }
    >
      {templates.length === 0 ? (
        <div className='flex flex-col items-center gap-2 py-4 text-center text-sm text-muted-foreground'>
          <p>No templates yet.</p>
          <Button variant='link' className='h-auto p-0' asChild>
            <Link to='/settings/templates'>Add one in Settings → Templates</Link>
          </Button>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </DashboardSection>
  )
}
