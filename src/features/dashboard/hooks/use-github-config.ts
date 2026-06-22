import { useQuery } from '@tanstack/react-query'

import { dbRepo } from '@/lib/tauri/db'

/**
 * Loads the GitHub username and PAT from app_meta once per session.
 * The token is required for the contribution graph; optional for the profile.
 */
export function useGithubConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ['github', 'config'],
    queryFn: async () => ({
      username: await dbRepo.getMeta('github.username'),
      token: await dbRepo.getMeta('github.token'),
    }),
    staleTime: 60_000,
  })

  return {
    username: data?.username ?? null,
    token: data?.token ?? null,
    isLoading,
  }
}
