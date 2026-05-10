import React, { useState } from 'react'

import useDialogState from '@/hooks/use-dialog-state'
import type { Project } from '@/lib/tauri/types'

type ProjectsDialogType = 'detail' | 'add-manual' | 'edit-name' | 'remove'

type ProjectsContextType = {
  open: ProjectsDialogType | null
  setOpen: (str: ProjectsDialogType | null) => void
  currentRow: Project | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Project | null>>
}

const ProjectsContext = React.createContext<ProjectsContextType | null>(null)

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<ProjectsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Project | null>(null)

  return (
    <ProjectsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </ProjectsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProjects() {
  const ctx = React.useContext(ProjectsContext)
  if (!ctx) {
    throw new Error('useProjects must be used within <ProjectsProvider>')
  }
  return ctx
}
