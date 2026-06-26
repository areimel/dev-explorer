import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ContributionCell } from './contribution-cell'
import { CONTRIBUTION_LEVEL_CLASSES } from './contribution-levels'

function renderCell(props: { date: string; count: number; level: number }) {
  return render(
    <TooltipProvider>
      <ContributionCell {...props} />
    </TooltipProvider>
  )
}

describe('ContributionCell', () => {
  it('applies the level class to the square', async () => {
    const screen = await renderCell({ date: '2026-06-01', count: 5, level: 3 })
    const cell = screen.container.querySelector('[data-level="3"]')
    expect(cell).not.toBeNull()
    const expected = CONTRIBUTION_LEVEL_CLASSES[3].split(' ')[0]
    expect(cell?.className).toContain(expected)
  })

  it('clamps out-of-range levels', async () => {
    const screen = await renderCell({ date: '2026-06-01', count: 0, level: 99 })
    const cell = screen.container.querySelector('[data-level="4"]')
    expect(cell).not.toBeNull()
  })
})
