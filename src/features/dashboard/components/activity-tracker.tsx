import { Activity } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { tauriCommands } from '@/lib/tauri/commands'
import { useGithubConfig } from '../hooks/use-github-config'
import { ContributionGrid } from './contribution-grid'
import { DashboardSection } from './dashboard-section'

export function ActivityTracker() {
  const { username, token, isLoading: configLoading } = useGithubConfig()

  const {
    data: calendar,
    isLoading: calendarLoading,
    error,
  } = useQuery({
    queryKey: ['github', 'contributions', username, token],
    queryFn: () => tauriCommands.githubGetContributions(username!, token!),
    enabled: !!username && !!token,
    staleTime: 5 * 60_000,
  })

  const isLoading = configLoading || calendarLoading
  const missingConfig = !configLoading && (!username || !token)

  return (
    <DashboardSection title='Activity' icon={Activity}>
      {missingConfig && (
        <div className='flex flex-col items-center gap-2 py-4 text-center text-sm text-muted-foreground'>
          <p>
            The contribution graph requires a GitHub username <em>and</em> a
            Personal Access Token.
          </p>
          <Button variant='link' className='h-auto p-0' asChild>
            <Link to='/settings/github'>Configure in Settings</Link>
          </Button>
        </div>
      )}

      {isLoading && <Skeleton className='h-28 w-full' />}

      {!isLoading && !missingConfig && error && (
        <p className='text-sm text-muted-foreground'>
          Couldn&apos;t load activity.{' '}
          <span className='text-destructive'>
            {error instanceof Error ? error.message : String(error)}
          </span>
        </p>
      )}

      {!isLoading && !error && calendar && (
        <ContributionGrid calendar={calendar} />
      )}
    </DashboardSection>
  )
}
