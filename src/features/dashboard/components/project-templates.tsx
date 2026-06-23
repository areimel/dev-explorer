import { useEffect, useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { Package } from 'lucide-react'
import { useProjectsStore } from '@/stores/projects-store'
import { useTemplatesStore } from '@/stores/templates-store'
import { Button } from '@/components/ui/button'
import { DashboardSection } from './dashboard-section'
import { ProjectCardGrid } from './project-card-grid'
import { TemplateCard } from './template-card'

export function ProjectTemplates() {
  const templates = useTemplatesStore((s) => s.templates)
  const projects = useProjectsStore((s) => s.projects)
  const templateProjectIds = useProjectsStore((s) => s.templateProjectIds)

  useEffect(() => {
    void useTemplatesStore.getState().load()
  }, [])

  const templateProjects = useMemo(() => {
    const set = new Set(templateProjectIds)
    return projects.filter((p) => set.has(p.id))
  }, [projects, templateProjectIds])

  const isEmpty = templateProjects.length === 0 && templates.length === 0
  // Label each group only when both kinds are present, to disambiguate the
  // (visually distinct) project cards from the clone-command repo cards.
  const showLabels = templateProjects.length > 0 && templates.length > 0

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
      {isEmpty ? (
        <div className='flex flex-col items-center gap-2 py-4 text-center text-sm text-muted-foreground'>
          <p>No templates yet.</p>
          <Button variant='link' className='h-auto p-0' asChild>
            <Link to='/settings/templates'>
              Add one in Settings → Templates
            </Link>
          </Button>
        </div>
      ) : (
        <div className='space-y-6'>
          {templateProjects.length > 0 && (
            <div className='space-y-2'>
              {showLabels && (
                <p className='font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Template Projects
                </p>
              )}
              <ProjectCardGrid projects={templateProjects} />
            </div>
          )}
          {templates.length > 0 && (
            <div className='space-y-2'>
              {showLabels && (
                <p className='font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Starter Repos
                </p>
              )}
              <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                {templates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardSection>
  )
}
