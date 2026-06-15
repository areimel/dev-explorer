import { clearCookies } from '@/test-utils/cookies'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { getCookie, setCookie } from '@/lib/cookies'
import { ThemeProvider } from '@/context/theme-provider'
import { ThemeSwitch } from './theme-switch'

async function renderThemeSwitch() {
  return await render(
    <ThemeProvider>
      <ThemeSwitch />
    </ThemeProvider>
  )
}

async function openMenu(screen: Awaited<ReturnType<typeof renderThemeSwitch>>) {
  await userEvent.click(screen.getByRole('button', { name: /toggle theme/i }))
  await expect.element(screen.getByText(/^Color scheme$/i)).toBeInTheDocument()
}

describe('ThemeSwitch (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    clearCookies()

    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.removeAttribute('data-color-scheme')
  })

  it('opening the menu renders mode controls and scheme list', async () => {
    const screen = await renderThemeSwitch()
    await openMenu(screen)

    await expect.element(screen.getByText(/^Mode$/i)).toBeInTheDocument()

    await expect
      .element(screen.getByRole('radio', { name: /^light$/i }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('radio', { name: /^dark$/i }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('radio', { name: /^system$/i }))
      .toBeInTheDocument()

    await expect
      .element(screen.getByRole('menuitem', { name: /default/i }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('menuitem', { name: /catppuccin/i }))
      .toBeInTheDocument()
    await expect
      .element(screen.getByRole('menuitem', { name: /nord/i }))
      .toBeInTheDocument()
  })

  describe('color scheme selection', () => {
    it('selecting Catppuccin sets data-color-scheme attribute and cookie', async () => {
      const screen = await renderThemeSwitch()
      await openMenu(screen)

      await userEvent.click(
        screen.getByRole('menuitem', { name: /catppuccin/i })
      )

      await vi.waitFor(() =>
        expect(document.documentElement.getAttribute('data-color-scheme')).toBe(
          'catppuccin'
        )
      )
      expect(getCookie('vite-ui-color-scheme')).toBe('catppuccin')
    })

    it('selecting Default removes data-color-scheme attribute, cookie becomes "default"', async () => {
      setCookie('vite-ui-color-scheme', 'nord')

      const screen = await renderThemeSwitch()
      await openMenu(screen)

      await userEvent.click(
        screen.getByRole('menuitem', { name: /^default$/i })
      )

      await vi.waitFor(() =>
        expect(
          document.documentElement.getAttribute('data-color-scheme')
        ).toBeNull()
      )
      expect(getCookie('vite-ui-color-scheme')).toBe('default')
    })
  })

  it('scheme and mode are orthogonal: atom + dark both apply', async () => {
    const screen = await renderThemeSwitch()
    await openMenu(screen)

    await userEvent.click(screen.getByRole('menuitem', { name: /^atom$/i }))
    await vi.waitFor(() =>
      expect(document.documentElement.getAttribute('data-color-scheme')).toBe(
        'atom'
      )
    )

    await userEvent.click(screen.getByRole('radio', { name: /^dark$/i }))

    await vi.waitFor(() =>
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    )
    expect(document.documentElement.getAttribute('data-color-scheme')).toBe(
      'atom'
    )
  })

  describe('mode controls', () => {
    it('selecting Light applies light class and writes vite-ui-theme cookie', async () => {
      const screen = await renderThemeSwitch()
      await openMenu(screen)

      await userEvent.click(screen.getByRole('radio', { name: /^light$/i }))

      await vi.waitFor(() =>
        expect(document.documentElement.classList.contains('light')).toBe(true)
      )
      expect(getCookie('vite-ui-theme')).toBe('light')
    })
  })
})
