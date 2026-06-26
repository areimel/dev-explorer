/**
 * level → Tailwind background class for a contribution square (index 0..4).
 * Shared by ContributionCell and the activity legend so swatches stay in sync.
 */
export const CONTRIBUTION_LEVEL_CLASSES = [
  'bg-muted',
  'bg-emerald-200 dark:bg-emerald-900',
  'bg-emerald-400 dark:bg-emerald-700',
  'bg-emerald-500 dark:bg-emerald-500',
  'bg-emerald-700 dark:bg-emerald-300',
] as const
