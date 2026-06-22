import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { type ContributionCalendar } from '@/lib/tauri/types'
import { ContributionGrid } from './contribution-grid'

function makeCalendar(weekCount: number, daysPerWeek = 7): ContributionCalendar {
  const weeks = Array.from({ length: weekCount }, (_, wi) => ({
    days: Array.from({ length: daysPerWeek }, (_, di) => ({
      date: `2026-0${wi + 1}-${String(di + 1).padStart(2, '0')}`,
      count: wi * 7 + di,
      level: (wi * 7 + di) % 5,
    })),
  }))
  return { totalContributions: 42, weeks }
}

describe('ContributionGrid', () => {
  it('renders the correct number of day squares', async () => {
    const calendar = makeCalendar(2)
    const screen = await render(<ContributionGrid calendar={calendar} />)
    const cells = screen.container.querySelectorAll('[data-level]')
    expect(cells).toHaveLength(14)
  })

  it('displays the total contributions text', async () => {
    const calendar = makeCalendar(2)
    const screen = await render(<ContributionGrid calendar={calendar} />)
    await expect
      .element(
        screen.getByText('42 contributions in the last year')
      )
      .toBeInTheDocument()
  })

  it('renders 0 squares for an empty calendar', async () => {
    const calendar: ContributionCalendar = { totalContributions: 0, weeks: [] }
    const screen = await render(<ContributionGrid calendar={calendar} />)
    const cells = screen.container.querySelectorAll('[data-level]')
    expect(cells).toHaveLength(0)
  })
})
