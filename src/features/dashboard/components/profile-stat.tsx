/**
 * A single labeled statistic (value over label). Used three times in the
 * GitHub profile card (repos / followers / following).
 */
export function ProfileStat({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
  return (
    <div className='flex flex-col items-center gap-0.5'>
      <span className='text-xl font-semibold tabular-nums'>{value}</span>
      <span className='text-[10px] uppercase tracking-wider text-muted-foreground'>
        {label}
      </span>
    </div>
  )
}
