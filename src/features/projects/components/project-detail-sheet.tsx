import { useEffect, useState } from 'react'
import {
  Check,
  Copy,
  FolderOpen,
  GitBranch,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useLaunchersStore } from '@/stores/launchers-store'
import { tauriCommands } from '@/lib/tauri/commands'
import type { Project, ProjectDetails } from '@/lib/tauri/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useGitStatuses } from '../hooks/use-git-statuses'
import { LauncherButton } from './launcher-button'
import { useProjects } from './projects-provider'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      className='size-7'
      onClick={() => void handleCopy()}
      title='Copy path'
    >
      {copied ? <Check className='size-3.5' /> : <Copy className='size-3.5' />}
    </Button>
  )
}

// Inner component: mounted only while the sheet is open (via conditional render in parent)
// This avoids needing setState-in-effect guards around async loading.
function SheetBody({
  project,
  onOpenChange,
}: {
  project: Project
  onOpenChange: (open: boolean) => void
}) {
  const { setOpen, setCurrentRow } = useProjects()
  const launchers = useLaunchersStore((s) => s.launchers)
  const { data: gitStatuses } = useGitStatuses()
  const gitStatus = gitStatuses?.[project.path]
  const [details, setDetails] = useState<ProjectDetails | null>(null)
  const [detailsLoaded, setDetailsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    tauriCommands
      .readProjectDetails(project.path)
      .then((d) => {
        if (!cancelled) {
          setDetails(d)
          setDetailsLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetails(null)
          setDetailsLoaded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [project.path])

  const formatted = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(project.lastModifiedMs))

  function openEditName() {
    setOpen('edit-name')
  }

  function openRemove() {
    onOpenChange(false)
    setTimeout(() => {
      setCurrentRow(project)
      setOpen('remove')
    }, 300)
  }

  async function reveal() {
    await tauriCommands.revealInExplorer(project.path)
  }

  return (
    <>
      <SheetHeader className='border-b px-6 pt-6 pb-4'>
        <div className='flex items-start justify-between gap-2 pr-6'>
          <div className='flex min-w-0 items-center gap-2'>
            <SheetTitle className='truncate text-lg'>{project.name}</SheetTitle>
            <Button
              variant='ghost'
              size='icon'
              className='size-7 shrink-0'
              onClick={openEditName}
              title='Edit name'
            >
              <Pencil className='size-3.5' />
            </Button>
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='size-7 shrink-0 text-destructive hover:text-destructive'
            onClick={openRemove}
            title='Remove project'
          >
            <Trash2 className='size-3.5' />
          </Button>
        </div>
        <SheetDescription asChild>
          <div className='flex min-w-0 items-center gap-1'>
            <span
              className='truncate text-xs text-muted-foreground'
              title={project.path}
            >
              {project.path}
            </span>
            <CopyButton text={project.path} />
            <Button
              variant='ghost'
              size='icon'
              className='size-7 shrink-0'
              onClick={() => void reveal()}
              title='Reveal in Explorer'
            >
              <FolderOpen className='size-3.5' />
            </Button>
          </div>
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className='flex-1'>
        <div className='space-y-6 px-6 py-4'>
          {/* Metadata */}
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm'>
              <span className='w-28 text-muted-foreground'>Last modified</span>
              <span>{formatted}</span>
            </div>
            {project.language && (
              <div className='flex items-center gap-2 text-sm'>
                <span className='w-28 text-muted-foreground'>Language</span>
                <Badge variant='secondary'>{project.language}</Badge>
              </div>
            )}
            {gitStatus?.isRepo && (
              <div className='flex items-center gap-2 text-sm'>
                <span className='w-28 text-muted-foreground'>Git</span>
                <span className='flex min-w-0 items-center gap-1.5'>
                  <GitBranch className='size-3.5 shrink-0 text-muted-foreground' />
                  <span
                    className={cn(
                      'truncate font-mono text-xs',
                      gitStatus.detached && 'italic'
                    )}
                  >
                    {gitStatus.branch ?? 'unknown'}
                  </span>
                  {gitStatus.isDirty && (
                    <Badge
                      variant='outline'
                      className='text-xs text-amber-600 dark:text-amber-500'
                    >
                      Uncommitted changes
                    </Badge>
                  )}
                </span>
              </div>
            )}
            <div className='flex items-center gap-2 text-sm'>
              <span className='w-28 text-muted-foreground'>Source</span>
              <Badge
                variant={project.source === 'manual' ? 'outline' : 'default'}
              >
                {project.source === 'manual' ? 'Manual' : 'Scanned'}
              </Badge>
            </div>
            {project.manifests.length > 0 && (
              <div className='flex items-start gap-2 text-sm'>
                <span className='w-28 pt-0.5 text-muted-foreground'>
                  Manifests
                </span>
                <div className='flex flex-wrap gap-1'>
                  {project.manifests.map((m) => (
                    <Badge key={m} variant='outline' className='text-xs'>
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Launchers */}
          {launchers.length > 0 && (
            <div className='space-y-2'>
              <h3 className='text-sm font-semibold'>Open with</h3>
              <div className='flex flex-wrap gap-2'>
                {launchers.map((launcher) => (
                  <LauncherButton
                    key={launcher.id}
                    launcher={launcher}
                    projectPath={project.path}
                  />
                ))}
              </div>
            </div>
          )}

          {/* README preview */}
          <div className='space-y-2'>
            <h3 className='text-sm font-semibold'>README</h3>
            {!detailsLoaded ? (
              <p className='text-sm text-muted-foreground'>Loading…</p>
            ) : details?.readmeMarkdown ? (
              <pre className='overflow-x-auto rounded-md bg-muted p-4 text-xs whitespace-pre-wrap text-muted-foreground'>
                {details.readmeMarkdown}
              </pre>
            ) : (
              <p className='text-sm text-muted-foreground'>No README found.</p>
            )}
          </div>
        </div>
      </ScrollArea>
    </>
  )
}

type Props = {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectDetailSheet({ project, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className='flex w-full flex-col p-0 sm:max-w-[640px]'
        side='right'
      >
        {open && <SheetBody project={project} onOpenChange={onOpenChange} />}
      </SheetContent>
    </Sheet>
  )
}
