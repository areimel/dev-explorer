import { getCookie, setCookie } from '@/lib/cookies'
import type { NavigateFn } from '@/hooks/use-table-url-state'

export type ViewMode = 'table' | 'grid'

const COOKIE_NAME = 'projects-view-mode'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function isValidViewMode(value: string | undefined): value is ViewMode {
  return value === 'table' || value === 'grid'
}

function resolveViewMode(search: { view?: ViewMode }): ViewMode {
  if (search.view != null) return search.view
  const cookie = getCookie(COOKIE_NAME)
  if (isValidViewMode(cookie)) return cookie
  return 'table'
}

export function useViewMode({
  search,
  navigate,
}: {
  search: { view?: ViewMode }
  navigate: NavigateFn
}): { viewMode: ViewMode; setViewMode: (m: ViewMode) => void } {
  const viewMode = resolveViewMode(search)

  function setViewMode(mode: ViewMode) {
    setCookie(COOKIE_NAME, mode, COOKIE_MAX_AGE)
    navigate({
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        view: mode,
        page: undefined,
      }),
      replace: true,
    })
  }

  return { viewMode, setViewMode }
}
