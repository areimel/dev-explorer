import { Star } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { DashboardSection } from './dashboard-section'

describe('DashboardSection', () => {
  it('renders the title and children', async () => {
    const screen = await render(
      <DashboardSection title='Pinned Projects' icon={Star}>
        <div>section body</div>
      </DashboardSection>
    )
    await expect.element(screen.getByText('Pinned Projects')).toBeInTheDocument()
    await expect.element(screen.getByText('section body')).toBeInTheDocument()
  })

  it('renders the action node when provided', async () => {
    const screen = await render(
      <DashboardSection title='Templates' action={<button>Manage</button>}>
        <div>body</div>
      </DashboardSection>
    )
    await expect
      .element(screen.getByRole('button', { name: 'Manage' }))
      .toBeInTheDocument()
  })
})
