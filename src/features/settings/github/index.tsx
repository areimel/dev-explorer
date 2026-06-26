import { useEffect, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { dbRepo } from '@/lib/tauri/db'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { ContentSection } from '../components/content-section'

export function SettingsGitHub() {
  const queryClient = useQueryClient()
  const [username, setUsername] = useState('')
  const [token, setToken] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      const [u, t] = await Promise.all([
        dbRepo.getMeta('github.username'),
        dbRepo.getMeta('github.token'),
      ])
      setUsername(u ?? '')
      setToken(t ?? '')
      setLoaded(true)
    })()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await dbRepo.setMeta('github.username', username.trim())
      await dbRepo.setMeta('github.token', token.trim())
      await queryClient.invalidateQueries({ queryKey: ['github'] })
      toast.success('GitHub settings saved')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ContentSection
      title='GitHub'
      desc='Connect your GitHub account to show your profile and contribution activity on the dashboard.'
    >
      <div className='space-y-6'>
        <div className='space-y-2'>
          <Label htmlFor='github-username'>Username</Label>
          <Input
            id='github-username'
            placeholder='octocat'
            value={username}
            disabled={!loaded}
            onChange={(e) => setUsername(e.target.value)}
          />
          <p className='text-xs text-muted-foreground'>
            Used to load your public profile.
          </p>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='github-token'>Personal Access Token</Label>
          <Input
            id='github-token'
            type='password'
            placeholder='ghp_…'
            value={token}
            disabled={!loaded}
            onChange={(e) => setToken(e.target.value)}
          />
          <p className='text-xs text-muted-foreground'>
            Required for the contribution graph (read-only access). Stored
            locally in your app database. Create one at{' '}
            <a
              href='https://github.com/settings/tokens'
              target='_blank'
              rel='noreferrer'
              className='underline'
            >
              github.com/settings/tokens
            </a>
            .
          </p>
        </div>

        <Button
          onClick={() => void handleSave()}
          disabled={!loaded || saving}
        >
          Save
        </Button>
      </div>
    </ContentSection>
  )
}
