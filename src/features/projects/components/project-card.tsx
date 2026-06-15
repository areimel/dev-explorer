import { formatDistanceToNow } from 'date-fns'
import { GitBranch, History } from 'lucide-react'
import type { GitStatus, Project } from '@/lib/tauri/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ProjectActionsMenu } from './project-actions-menu'
import { ProjectCardLaunchers } from './project-card-launchers'
import { useProjects } from './projects-provider'

// Deterministic color dot per language
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Rust: 'bg-orange-500',
  Python: 'bg-green-500',
  Go: 'bg-cyan-500',
  Ruby: 'bg-red-500',
  Java: 'bg-orange-400',
  'C#': 'bg-purple-500',
  'C++': 'bg-blue-400',
  C: 'bg-gray-500',
  Swift: 'bg-orange-400',
  Kotlin: 'bg-violet-500',
  PHP: 'bg-indigo-400',
  Dart: 'bg-cyan-400',
  Scala: 'bg-red-400',
  Elixir: 'bg-purple-400',
  Haskell: 'bg-violet-400',
  Lua: 'bg-blue-300',
  Shell: 'bg-green-400',
}

function languageDotClass(language: string): string {
  return LANGUAGE_COLORS[language] ?? 'bg-muted-foreground'
}

const MAX_VISIBLE_MANIFESTS = 3

export function ProjectCard({
  project,
  gitStatus,
  gitLoading,
}: {
  project: Project
  gitStatus: GitStatus | undefined
  gitLoading: boolean
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

  const visibleManifests = project.manifests.slice(0, MAX_VISIBLE_MANIFESTS)
  const overflowManifests = project.manifests.slice(MAX_VISIBLE_MANIFESTS)
  const overflowCount = overflowManifests.length

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
        className='group flex cursor-pointer flex-col gap-0 p-0 transition-all duration-200 hover:border-foreground/20 hover:shadow-md'
      >
        <CardHeader className='flex flex-col gap-1 px-4 pt-4 pb-0'>
          {/* Header row: name + actions menu */}
          <div className='flex min-w-0 items-start justify-between gap-2'>
            <span
              className='min-w-0 flex-1 truncate text-sm font-semibold tracking-tight'
              title={project.name}
            >
              {project.name}
            </span>
            <div
              className='shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100'
              onClick={(e) => e.stopPropagation()}
            >
              <ProjectActionsMenu
                project={project}
                className='ghost size-7 p-0'
              />
            </div>
          </div>
          {/* Path row */}
          <p
            className='truncate font-mono text-xs text-muted-foreground'
            title={project.path}
          >
            {project.path}
          </p>
        </CardHeader>

        <CardContent className='flex flex-col gap-3 px-4 pt-3 pb-0'>
          {/* Badge row */}
          <div className='flex flex-wrap gap-1.5'>
            {project.language && (
              <Badge
                variant='secondary'
                className='flex items-center gap-1.5 text-xs'
              >
                <span
                  className={`size-1.5 shrink-0 rounded-full ${languageDotClass(project.language)}`}
                />
                {project.language}
              </Badge>
            )}
            <Badge variant='outline' className='text-xs'>
              {project.source === 'manual' ? 'manual' : 'scanned'}
            </Badge>
            {visibleManifests.map((m) => (
              <Badge key={m} variant='outline' className='font-mono text-xs'>
                {m}
              </Badge>
            ))}
            {overflowCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant='outline'
                    className='cursor-default text-xs'
                    onClick={(e) => e.stopPropagation()}
                  >
                    +{overflowCount}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs'>{overflowManifests.join(', ')}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Meta row */}
          <div className='flex items-center gap-3 text-xs text-muted-foreground'>
            {/* Git segment */}
            {gitLoading && <Skeleton className='h-3.5 w-20' />}
            {showGit && gitStatus && (
              <span className='flex items-center gap-1'>
                <GitBranch className='size-3.5 shrink-0' />
                <span
                  className={`font-mono${gitStatus.detached ? ' italic' : ''}`}
                >
                  {gitStatus.branch ?? 'HEAD'}
                </span>
                {gitStatus.isDirty && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className='inline-block size-1.5 cursor-default rounded-full bg-amber-500'
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>Uncommitted changes</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
            )}
            {/* Time segment */}
            <span className='ml-auto flex items-center gap-1'>
              <History className='size-3.5 shrink-0' />
              <span>{relativeTime}</span>
            </span>
          </div>
        </CardContent>

        <CardFooter className='mt-auto flex flex-col gap-3 px-4 pt-3 pb-4'>
          <Separator />
          <div className='w-full' onClick={(e) => e.stopPropagation()}>
            <ProjectCardLaunchers projectPath={project.path} />
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}
