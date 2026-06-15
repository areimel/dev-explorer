import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useProjectsStore } from '@/stores/projects-store'
import { tauriCommands } from '@/lib/tauri/commands'

export function useGitStatuses() {
  const projects = useProjectsStore((s) => s.projects)
  const paths = useMemo(
    () => [...projects.map((p) => p.path)].sort(),
    [projects]
  )
  return useQuery({
    queryKey: ['git-statuses', paths],
    queryFn: () => tauriCommands.getGitStatuses(paths),
    enabled: paths.length > 0,
    staleTime: 30_000,
  })
}
