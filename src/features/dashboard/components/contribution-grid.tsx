import { TooltipProvider } from '@/components/ui/tooltip'
import { type ContributionCalendar } from '@/lib/tauri/types'
import { cn } from '@/lib/utils'
import { ContributionCell } from './contribution-cell'
import { CONTRIBUTION_LEVEL_CLASSES } from './contribution-levels'

export function ContributionGrid({
  calendar,
}: {
  calendar: ContributionCalendar
}) {
  return (
    <TooltipProvider>
      <div className='flex flex-col gap-3'>
        <div className='flex gap-1 overflow-x-auto'>
          {calendar.weeks.map((week, wi) => (
            <div key={wi} className='flex flex-col gap-1'>
              {week.days.map((day) => (
                <ContributionCell
                  key={day.date}
                  date={day.date}
                  count={day.count}
                  level={day.level}
                />
              ))}
            </div>
          ))}
        </div>

        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span>
            {calendar.totalContributions} contributions in the last year
          </span>
          <div className='flex items-center gap-1'>
            <span>Less</span>
            {CONTRIBUTION_LEVEL_CLASSES.map((cls, i) => (
              <span
                key={i}
                className={cn('size-3 rounded-[2px]', cls)}
                aria-label={`Level ${i}`}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
