import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import type { Template } from '@/lib/tauri/types'
import { TemplateCard } from './template-card'

const TEMPLATE: Template = {
  id: 't1',
  name: 'Vite + React',
  description: 'A minimal starter',
  repoUrl: 'https://github.com/user/vite-react.git',
  language: 'TypeScript',
  tags: ['frontend', 'spa'],
}

describe('TemplateCard', () => {
  it('renders name, language, tags and the git clone command', async () => {
    const screen = await render(<TemplateCard template={TEMPLATE} />)
    await expect.element(screen.getByText('Vite + React')).toBeInTheDocument()
    await expect.element(screen.getByText('TypeScript')).toBeInTheDocument()
    await expect.element(screen.getByText('frontend')).toBeInTheDocument()
    await expect
      .element(
        screen.getByText('git clone https://github.com/user/vite-react.git')
      )
      .toBeInTheDocument()
  })

  it('exposes a copy command button', async () => {
    const screen = await render(<TemplateCard template={TEMPLATE} />)
    await expect
      .element(screen.getByRole('button', { name: /copy git clone command/i }))
      .toBeInTheDocument()
  })
})
