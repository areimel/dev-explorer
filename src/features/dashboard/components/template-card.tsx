import { ExternalLink } from 'lucide-react'
import type { Template } from '@/lib/tauri/types'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CopyButton } from '@/components/copy-button'

export function TemplateCard({ template }: { template: Template }) {
  const cloneCommand = `git clone ${template.repoUrl}`

  return (
    <Card className='flex flex-col gap-3 p-4'>
      <div className='flex items-start justify-between gap-2'>
        <h3 className='truncate font-semibold' title={template.name}>
          {template.name}
        </h3>
        {template.language && (
          <Badge variant='secondary' className='shrink-0'>
            {template.language}
          </Badge>
        )}
      </div>

      {template.description && (
        <p className='line-clamp-2 text-sm text-muted-foreground'>
          {template.description}
        </p>
      )}

      {template.tags.length > 0 && (
        <div className='flex flex-wrap gap-1'>
          {template.tags.map((tag) => (
            <Badge key={tag} variant='outline'>
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className='mt-auto flex items-center gap-1 border-t pt-3'>
        <code
          className='min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs'
          title={cloneCommand}
        >
          {cloneCommand}
        </code>
        <CopyButton text={cloneCommand} title='Copy git clone command' />
        <a
          href={template.repoUrl}
          target='_blank'
          rel='noreferrer'
          title='Open repository'
          className='inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        >
          <ExternalLink className='size-3.5' />
          <span className='sr-only'>Open repository</span>
        </a>
      </div>
    </Card>
  )
}
