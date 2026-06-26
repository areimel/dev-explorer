import { type LucideIcon } from 'lucide-react'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Shared wrapper for every dashboard section: a Card with a titled header
 * (optional leading icon + optional right-aligned action) and a content body.
 * Used by all five dashboard sections to keep their chrome consistent.
 */
export function DashboardSection({
  title,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string
  icon?: LucideIcon
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base font-semibold'>
          {Icon && <Icon className='size-4 text-muted-foreground' />}
          {title}
        </CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
}
