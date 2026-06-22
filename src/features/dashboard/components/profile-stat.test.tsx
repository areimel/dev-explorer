import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { ProfileStat } from './profile-stat'

describe('ProfileStat', () => {
  it('renders the value and label', async () => {
    const screen = await render(<ProfileStat label='Followers' value={42} />)
    await expect.element(screen.getByText('42')).toBeInTheDocument()
    await expect.element(screen.getByText('Followers')).toBeInTheDocument()
  })
})
