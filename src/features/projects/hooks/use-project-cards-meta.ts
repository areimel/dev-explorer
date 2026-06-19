import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useProjectsStore } from '@/stores/projects-store'
import { tauriCommands } from '@/lib/tauri/commands'

export function useProjectCardsMeta() {
  const projects = useProjectsStore((s) => s.projects)
  const paths = useMemo(
    () => [...projects.map((p) => p.path)].sort(),
    [projects]
  )
  return useQuery({
    queryKey: ['project-cards-meta', paths],
    queryFn: () => tauriCommands.getProjectCardsMeta(paths),
    enabled: paths.length > 0,
    staleTime: 60_000,
  })
}
