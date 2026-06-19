import { formatDistanceToNow } from 'date-fns'
import type { GitStatus, Project, ProjectCardMeta } from '@/lib/tauri/types'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CopyButton } from './copy-button'
import { languageDotClass } from './language-colors'
import { ProjectActionsMenu } from './project-actions-menu'
import { ProjectCardLaunchers } from './project-card-launchers'
import { ProjectThumbnail } from './project-thumbnail'
import { useProjects } from './projects-provider'

export function ProjectCard({
  project,
  gitStatus,
  gitLoading,
  cardMeta,
  metaLoading,
}: {
  project: Project
  gitStatus: GitStatus | undefined
  gitLoading: boolean
  cardMeta: ProjectCardMeta | undefined
  metaLoading: boolean
}) {
  const { setOpen, setCurrentRow } = useProjects()

  function openDetail() {
    setCurrentRow(project)
    setOpen('detail')
  }

  function handleClick() {
    openDetail()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openDetail()
    }
  }

  const relativeTime = formatDistanceToNow(new Date(project.lastModifiedMs), {
    addSuffix: true,
  })

  const showGit = !gitLoading && gitStatus?.isRepo === true

  return (
    <TooltipProvider>
      <Card
        role='button'
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className='group relative flex cursor-pointer flex-col gap-0 rounded-none border p-0 shadow-none transition-colors duration-150 hover:border-foreground/40'
      >
        {/* 1. Banner */}
        <div className='relative'>
          <ProjectThumbnail
            thumbnailDataUri={cardMeta?.thumbnailDataUri ?? null}
            language={project.language}
            name={project.name}
          />
          {/* Actions menu — floated over top-right of banner */}
          <div
            className='absolute top-1.5 right-1.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100'
            onClick={(e) => e.stopPropagation()}
          >
            <ProjectActionsMenu project={project} className='ghost size-7 p-0' />
          </div>
        </div>

        {/* 2. Title + path block */}
        <div className='px-4 pt-3 pb-2'>
          <span
            className='block truncate text-sm font-bold uppercase tracking-tight'
            title={project.name}
          >
            {project.name}
          </span>
          {/* Path datasheet box */}
          <div className='mt-1.5 flex items-center border bg-muted/40'>
            <span
              className='min-w-0 flex-1 truncate px-2 py-1 font-mono text-[11px] text-muted-foreground'
              title={project.path}
            >
              {project.path}
            </span>
            <div className='shrink-0 border-l'>
              <CopyButton text={project.path} title='Copy path' />
            </div>
          </div>
        </div>

        {/* 3. Description section — omitted when empty/loading to keep cards tight */}
        {(metaLoading || cardMeta?.description) && (
          <div className='border-t px-4 py-2.5'>
            <p className='mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground'>
              Description
            </p>
            {metaLoading ? (
              <div className='flex flex-col gap-1'>
                <Skeleton className='h-3 w-full' />
                <Skeleton className='h-3 w-3/4' />
              </div>
            ) : (
              <p className='line-clamp-2 text-xs text-foreground/80'>
                {cardMeta?.description}
              </p>
            )}
          </div>
        )}

        {/* 4. Datasheet meta strip */}
        <div className='border-t'>
          <div className='grid grid-cols-3 divide-x text-center'>
            {/* LANG */}
            <div className='px-2 py-1.5'>
              <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
                Lang
              </p>
              <div className='mt-0.5 flex items-center justify-center gap-1'>
                {project.language ? (
                  <>
                    <span
                      className={`size-1.5 rounded-full ${languageDotClass(project.language)}`}
                    />
                    <span className='text-[11px]'>{project.language}</span>
                  </>
                ) : (
                  <span className='text-[11px] text-muted-foreground'>—</span>
                )}
              </div>
            </div>

            {/* BRANCH */}
            <div className='px-2 py-1.5'>
              <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
                Branch
              </p>
              <div className='mt-0.5 flex items-center justify-center gap-1'>
                {gitLoading ? (
                  <Skeleton className='h-3 w-12' />
                ) : showGit && gitStatus ? (
                  <>
                    <span
                      className={`truncate font-mono text-[11px]${gitStatus.detached ? ' italic' : ''}`}
                    >
                      {gitStatus.branch ?? 'HEAD'}
                    </span>
                    {gitStatus.isDirty && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className='inline-block size-1.5 shrink-0 cursor-default rounded-full bg-amber-500'
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className='text-xs'>Uncommitted changes</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </>
                ) : (
                  <span className='text-[11px] text-muted-foreground'>—</span>
                )}
              </div>
            </div>

            {/* MODIFIED */}
            <div className='px-2 py-1.5'>
              <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
                Modified
              </p>
              <p className='mt-0.5 text-[11px]'>{relativeTime}</p>
            </div>
          </div>
        </div>

        {/* 5. Launchers */}
        <div
          className='border-t p-3'
          onClick={(e) => e.stopPropagation()}
        >
          <ProjectCardLaunchers projectPath={project.path} />
        </div>
      </Card>
    </TooltipProvider>
  )
}
