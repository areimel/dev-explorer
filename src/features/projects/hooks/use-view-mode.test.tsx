import { clearCookies } from '@/test-utils/cookies'
import { beforeEach, describe, expect, it } from 'vitest'
import { getCookie, setCookie } from '@/lib/cookies'
import type { NavigateFn } from '@/hooks/use-table-url-state'
import { useViewMode, type ViewMode } from './use-view-mode'

function makeNavigate(): {
  navigate: NavigateFn
  calls: Parameters<NavigateFn>[]
} {
  const calls: Parameters<NavigateFn>[] = []
  const navigate: NavigateFn = (opts) => {
    calls.push([opts] as unknown as Parameters<NavigateFn>)
  }
  return { navigate, calls }
}

describe('useViewMode', () => {
  beforeEach(() => {
    clearCookies()
  })

  it('defaults to "table" with empty search and no cookie', () => {
    const { navigate } = makeNavigate()
    const { viewMode } = useViewMode({ search: {}, navigate })
    expect(viewMode).toBe('table')
  })

  it('resolves "grid" from cookie when no URL param is set', () => {
    setCookie('projects-view-mode', 'grid')
    const { navigate } = makeNavigate()
    const { viewMode } = useViewMode({ search: {}, navigate })
    expect(viewMode).toBe('grid')
  })

  it('URL param wins over cookie', () => {
    setCookie('projects-view-mode', 'grid')
    const { navigate } = makeNavigate()
    const { viewMode } = useViewMode({
      search: { view: 'table' as ViewMode },
      navigate,
    })
    expect(viewMode).toBe('table')
  })

  it('URL param "grid" wins over no cookie', () => {
    const { navigate } = makeNavigate()
    const { viewMode } = useViewMode({
      search: { view: 'grid' as ViewMode },
      navigate,
    })
    expect(viewMode).toBe('grid')
  })

  it('invalid cookie value falls back to "table"', () => {
    setCookie('projects-view-mode', 'invalid-value')
    const { navigate } = makeNavigate()
    const { viewMode } = useViewMode({ search: {}, navigate })
    expect(viewMode).toBe('table')
  })

  describe('setViewMode', () => {
    it('writes the cookie and calls navigate with replace:true and view set', () => {
      const { navigate, calls } = makeNavigate()
      const { setViewMode } = useViewMode({ search: {}, navigate })

      setViewMode('grid')

      expect(getCookie('projects-view-mode')).toBe('grid')
      expect(calls).toHaveLength(1)

      const opts = calls[0][0]
      expect(opts.replace).toBe(true)

      // The search updater must set view and clear page while preserving other keys
      const updater = opts.search
      expect(typeof updater).toBe('function')
      if (typeof updater === 'function') {
        const prev = { page: 3, filter: 'x', pageSize: 20 }
        const result = updater(prev)
        expect(result).toEqual({
          page: undefined,
          filter: 'x',
          pageSize: 20,
          view: 'grid',
        })
      }
    })

    it('writes "table" cookie and sets view explicitly even for default mode', () => {
      const { navigate, calls } = makeNavigate()
      const { setViewMode } = useViewMode({ search: {}, navigate })

      setViewMode('table')

      expect(getCookie('projects-view-mode')).toBe('table')
      const updater = calls[0][0].search
      if (typeof updater === 'function') {
        const result = updater({ page: 3, filter: 'x' })
        expect(result).toMatchObject({ view: 'table', page: undefined })
        expect((result as Record<string, unknown>).filter).toBe('x')
      }
    })

    it('preserves unrelated search keys when switching view', () => {
      const { navigate, calls } = makeNavigate()
      const { setViewMode } = useViewMode({ search: {}, navigate })

      setViewMode('grid')

      const updater = calls[0][0].search
      if (typeof updater === 'function') {
        const prev = {
          page: 3,
          filter: 'react',
          language: ['typescript'],
          source: ['scanned'],
        }
        const result = updater(prev) as Record<string, unknown>
        expect(result.view).toBe('grid')
        expect(result.page).toBeUndefined()
        expect(result.filter).toBe('react')
        expect(result.language).toEqual(['typescript'])
        expect(result.source).toEqual(['scanned'])
      }
    })
  })
})
