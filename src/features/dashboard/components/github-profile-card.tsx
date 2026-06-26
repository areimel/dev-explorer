import { Building, GitBranch, MapPin } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { tauriCommands } from '@/lib/tauri/commands'
import { useGithubConfig } from '../hooks/use-github-config'
import { DashboardSection } from './dashboard-section'
import { ProfileStat } from './profile-stat'

export function GitHubProfileCard() {
  const { username, token, isLoading: configLoading } = useGithubConfig()

  const {
    data: profile,
    isLoading: profileLoading,
    error,
  } = useQuery({
    queryKey: ['github', 'profile', username, token],
    queryFn: () => tauriCommands.githubGetProfile(username!, token),
    enabled: !!username,
    staleTime: 5 * 60_000,
  })

  const isLoading = configLoading || profileLoading

  return (
    <DashboardSection title='GitHub' icon={GitBranch}>
      {!configLoading && !username && (
        <div className='flex flex-col items-center gap-2 py-4 text-center text-sm text-muted-foreground'>
          <p>No GitHub account configured.</p>
          <Button variant='link' className='h-auto p-0' asChild>
            <Link to='/settings/github'>
              Add your GitHub username in Settings → GitHub.
            </Link>
          </Button>
        </div>
      )}

      {isLoading && (
        <div className='flex gap-4'>
          <Skeleton className='size-14 shrink-0 rounded-full' />
          <div className='flex flex-1 flex-col gap-2'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-3 w-48' />
          </div>
        </div>
      )}

      {!isLoading && error && (
        <p className='text-sm text-muted-foreground'>
          Couldn&apos;t load profile.{' '}
          <span className='text-destructive'>
            {error instanceof Error ? error.message : String(error)}
          </span>
        </p>
      )}

      {!isLoading && !error && profile && (
        <div className='flex flex-col gap-4'>
          <div className='flex items-start gap-4'>
            <Avatar className='size-14 shrink-0'>
              <AvatarImage src={profile.avatarUrl} alt={profile.login} />
              <AvatarFallback>
                {profile.login.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className='min-w-0 flex-1'>
              <a
                href={profile.htmlUrl}
                target='_blank'
                rel='noreferrer'
                className='font-semibold hover:underline'
              >
                {profile.name ?? profile.login}
              </a>
              <p className='text-sm text-muted-foreground'>@{profile.login}</p>

              {profile.bio && (
                <p className='mt-1 text-sm text-muted-foreground line-clamp-2'>
                  {profile.bio}
                </p>
              )}

              {(profile.location || profile.company) && (
                <div className='mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground'>
                  {profile.location && (
                    <span className='flex items-center gap-1'>
                      <MapPin className='size-3' />
                      {profile.location}
                    </span>
                  )}
                  {profile.company && (
                    <span className='flex items-center gap-1'>
                      <Building className='size-3' />
                      {profile.company}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className='flex justify-around border-t pt-4'>
            <ProfileStat label='Repos' value={profile.publicRepos} />
            <ProfileStat label='Followers' value={profile.followers} />
            <ProfileStat label='Following' value={profile.following} />
          </div>
        </div>
      )}
    </DashboardSection>
  )
}
