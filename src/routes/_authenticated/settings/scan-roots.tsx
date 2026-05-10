import { createFileRoute } from '@tanstack/react-router'

import { SettingsScanRoots } from '@/features/settings/scan-roots'

export const Route = createFileRoute('/_authenticated/settings/scan-roots')({
  component: SettingsScanRoots,
})
