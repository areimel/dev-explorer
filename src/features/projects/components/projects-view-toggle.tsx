import { LayoutGrid, Rows3 } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ViewMode } from '../hooks/use-view-mode'

type ProjectsViewToggleProps = {
  viewMode: ViewMode
  onViewModeChange: (m: ViewMode) => void
}

export function ProjectsViewToggle({
  viewMode,
  onViewModeChange,
}: ProjectsViewToggleProps) {
  function handleValueChange(value: string) {
    if (value === 'table' || value === 'grid') {
      onViewModeChange(value)
    }
  }

  return (
    <ToggleGroup
      type='single'
      value={viewMode}
      onValueChange={handleValueChange}
      variant='outline'
      size='sm'
      className='h-8'
    >
      <ToggleGroupItem value='table' aria-label='Table view' title='Table view'>
        <Rows3 className='size-4' />
      </ToggleGroupItem>
      <ToggleGroupItem value='grid' aria-label='Grid view' title='Grid view'>
        <LayoutGrid className='size-4' />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
