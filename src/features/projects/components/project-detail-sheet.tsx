import { useEffect, useState } from 'react'
import * as Icons from 'lucide-react'
import { Check, Copy, FolderOpen, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { tauriCommands } from '@/lib/tauri/commands'
import type { Launcher, Project, ProjectDetails } from '@/lib/tauri/types'
import { useLaunchersStore } from '@/stores/launchers-store'
import { useProjects } from './projects-provider'

function LauncherIcon({ name }: { name: string }) {
  const Icon = (Icons as Record<string, unknown>)[name] as
    | React.ComponentType<{ className?: string }>
    | undefined
  const Resolved = Icon ?? Icons.Rocket
  return <Resolved className='size-4' />
}

function LauncherButton({
  launcher,
  projectPath,
}: {
  launcher: Launcher
  projectPath: string
}) {
  async function handleClick() {
    await tauriCommands.openWithLauncher(projectPath, launcher.commandTemplate)
    toast.success(`Opened with ${launcher.name}`)
  }

  return (
    <Button
      variant='outline'
      size='sm'
      className='flex items-center gap-2'
      onClick={() => void handleClick()}
    >
      <LauncherIcon name={launcher.icon} />
      {launcher.name}
    </Button>
  )
}

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
      <SheetHeader className='px-6 pt-6 pb-4 border-b'>
        <div className='flex items-start justify-between gap-2 pr-6'>
          <div className='flex items-center gap-2 min-w-0'>
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
            className='size-7 text-destructive hover:text-destructive shrink-0'
            onClick={openRemove}
            title='Remove project'
          >
            <Trash2 className='size-3.5' />
          </Button>
        </div>
        <SheetDescription asChild>
          <div className='flex items-center gap-1 min-w-0'>
            <span
              className='text-xs text-muted-foreground truncate'
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
        <div className='px-6 py-4 space-y-6'>
          {/* Metadata */}
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm'>
              <span className='text-muted-foreground w-28'>Last modified</span>
              <span>{formatted}</span>
            </div>
            {project.language && (
              <div className='flex items-center gap-2 text-sm'>
                <span className='text-muted-foreground w-28'>Language</span>
                <Badge variant='secondary'>{project.language}</Badge>
              </div>
            )}
            <div className='flex items-center gap-2 text-sm'>
              <span className='text-muted-foreground w-28'>Source</span>
              <Badge
                variant={project.source === 'manual' ? 'outline' : 'default'}
              >
                {project.source === 'manual' ? 'Manual' : 'Scanned'}
              </Badge>
            </div>
            {project.manifests.length > 0 && (
              <div className='flex items-start gap-2 text-sm'>
                <span className='text-muted-foreground w-28 pt-0.5'>
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
              <pre className='whitespace-pre-wrap text-xs text-muted-foreground bg-muted rounded-md p-4 overflow-x-auto'>
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
        className='w-full sm:max-w-[640px] flex flex-col p-0'
        side='right'
      >
        {open && <SheetBody project={project} onOpenChange={onOpenChange} />}
      </SheetContent>
    </Sheet>
  )
}
