import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CONTRIBUTION_LEVEL_CLASSES } from './contribution-levels'

/** A single GitHub-style heatmap day square with a hover tooltip. */
export function ContributionCell({
  date,
  count,
  level,
}: {
  date: string
  count: number
  level: number
}) {
  const clamped = Math.max(0, Math.min(level, CONTRIBUTION_LEVEL_CLASSES.length - 1))
  const noun = count === 1 ? 'contribution' : 'contributions'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          data-level={clamped}
          className={cn(
            'size-3 rounded-[2px]',
            CONTRIBUTION_LEVEL_CLASSES[clamped]
          )}
        />
      </TooltipTrigger>
      <TooltipContent>
        <p className='text-xs'>
          {count} {noun} on {date}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}
