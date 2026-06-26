import { createFileRoute } from '@tanstack/react-router'

import { SettingsGitHub } from '@/features/settings/github'

export const Route = createFileRoute('/_authenticated/settings/github')({
  component: SettingsGitHub,
})
