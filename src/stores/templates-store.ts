import { v4 as uuid } from 'uuid'
import { create } from 'zustand'

import { dbRepo } from '@/lib/tauri/db'
import type { Template } from '@/lib/tauri/types'

type State = {
  templates: Template[]
  loaded: boolean
  load: () => Promise<void>
  add: (template: Omit<Template, 'id'>) => Promise<Template>
  update: (id: string, patch: Partial<Omit<Template, 'id'>>) => Promise<void>
  remove: (id: string) => Promise<void>
  reorder: (orderedIds: string[]) => Promise<void>
}

export const useTemplatesStore = create<State>((set, get) => ({
  templates: [],
  loaded: false,
  async load() {
    if (get().loaded) return
    const stored = await dbRepo.listTemplates()
    set({ templates: stored, loaded: true })
  },
  async add(template) {
    const newTemplate: Template = { id: uuid(), ...template }
    set({ templates: [...get().templates, newTemplate] })
    await dbRepo.upsertTemplate(newTemplate)
    return newTemplate
  },
  async update(id, patch) {
    const next = get().templates.map((t) =>
      t.id === id ? { ...t, ...patch } : t
    )
    set({ templates: next })
    const updated = next.find((t) => t.id === id)
    if (updated) await dbRepo.upsertTemplate(updated)
  },
  async remove(id) {
    set({ templates: get().templates.filter((t) => t.id !== id) })
    await dbRepo.deleteTemplate(id)
  },
  async reorder(orderedIds) {
    const templateMap = new Map(get().templates.map((t) => [t.id, t]))
    const next = orderedIds
      .map((id) => templateMap.get(id))
      .filter((t): t is Template => t !== undefined)
    set({ templates: next })
    await dbRepo.setTemplateOrder(orderedIds)
  },
}))
