import { AddManualProjectDialog } from './add-manual-project-dialog'
import { EditProjectNameDialog } from './edit-project-name-dialog'
import { ProjectDetailSheet } from './project-detail-sheet'
import { useProjects } from './projects-provider'
import { RemoveProjectDialog } from './remove-project-dialog'

export function ProjectsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useProjects()

  function closeAndClear(delay = 500) {
    setOpen(null)
    setTimeout(() => setCurrentRow(null), delay)
  }

  return (
    <>
      <AddManualProjectDialog
        key='add-manual'
        open={open === 'add-manual'}
        onOpenChange={() => setOpen('add-manual')}
      />

      {currentRow && (
        <>
          <ProjectDetailSheet
            key={`detail-${currentRow.id}`}
            project={currentRow}
            open={open === 'detail'}
            onOpenChange={() => closeAndClear()}
          />

          <EditProjectNameDialog
            key={`edit-name-${currentRow.id}`}
            project={currentRow}
            open={open === 'edit-name'}
            onOpenChange={() => closeAndClear()}
          />

          <RemoveProjectDialog
            key={`remove-${currentRow.id}`}
            project={currentRow}
            open={open === 'remove'}
            onOpenChange={() => closeAndClear()}
            onRemoved={() => closeAndClear(0)}
          />
        </>
      )}
    </>
  )
}
