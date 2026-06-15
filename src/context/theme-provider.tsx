import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  type ColorScheme,
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_COOKIE_NAME,
  DEFAULT_COLOR_SCHEME,
} from '@/config/color-schemes'
import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = Exclude<Theme, 'system'>

const DEFAULT_THEME = 'system'
const THEME_COOKIE_NAME = 'vite-ui-theme'
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultColorScheme?: ColorScheme
  storageKey?: string
}

type ThemeProviderState = {
  defaultTheme: Theme
  resolvedTheme: ResolvedTheme
  theme: Theme
  setTheme: (theme: Theme) => void
  resetTheme: () => void
  colorScheme: ColorScheme
  setColorScheme: (scheme: ColorScheme) => void
  defaultColorScheme: ColorScheme
}

const initialState: ThemeProviderState = {
  defaultTheme: DEFAULT_THEME,
  resolvedTheme: 'light',
  theme: DEFAULT_THEME,
  setTheme: () => null,
  resetTheme: () => null,
  colorScheme: DEFAULT_COLOR_SCHEME,
  setColorScheme: () => null,
  defaultColorScheme: DEFAULT_COLOR_SCHEME,
}

const ThemeContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  defaultColorScheme = DEFAULT_COLOR_SCHEME,
  storageKey = THEME_COOKIE_NAME,
  ...props
}: ThemeProviderProps) {
  const [theme, _setTheme] = useState<Theme>(
    () => (getCookie(storageKey) as Theme) || defaultTheme
  )

  const [colorScheme, _setColorScheme] = useState<ColorScheme>(
    () =>
      (getCookie(COLOR_SCHEME_COOKIE_NAME) as ColorScheme) || defaultColorScheme
  )

  // Optimized: Memoize the resolved theme calculation to prevent unnecessary re-computations
  const resolvedTheme = useMemo((): ResolvedTheme => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return theme as ResolvedTheme
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (currentResolvedTheme: ResolvedTheme) => {
      root.classList.remove('light', 'dark') // Remove existing theme classes
      root.classList.add(currentResolvedTheme) // Add the new theme class
    }

    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        applyTheme(systemTheme)
      }
    }

    applyTheme(resolvedTheme)

    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, resolvedTheme])

  useEffect(() => {
    const root = window.document.documentElement
    if (colorScheme === DEFAULT_COLOR_SCHEME)
      root.removeAttribute(COLOR_SCHEME_ATTRIBUTE)
    else root.setAttribute(COLOR_SCHEME_ATTRIBUTE, colorScheme)
  }, [colorScheme])

  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    if (!metaThemeColor) return
    const bg = getComputedStyle(window.document.documentElement)
      .getPropertyValue('--background')
      .trim()
    if (bg) metaThemeColor.setAttribute('content', bg)
  }, [resolvedTheme, colorScheme])

  const setTheme = (theme: Theme) => {
    setCookie(storageKey, theme, THEME_COOKIE_MAX_AGE)
    _setTheme(theme)
  }

  const setColorScheme = (scheme: ColorScheme) => {
    setCookie(COLOR_SCHEME_COOKIE_NAME, scheme, THEME_COOKIE_MAX_AGE)
    _setColorScheme(scheme)
  }

  const resetTheme = () => {
    removeCookie(storageKey)
    _setTheme(DEFAULT_THEME)
    removeCookie(COLOR_SCHEME_COOKIE_NAME)
    _setColorScheme(defaultColorScheme)
  }

  const contextValue = {
    defaultTheme,
    resolvedTheme,
    resetTheme,
    theme,
    setTheme,
    colorScheme,
    setColorScheme,
    defaultColorScheme,
  }

  return (
    <ThemeContext value={contextValue} {...props}>
      {children}
    </ThemeContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
