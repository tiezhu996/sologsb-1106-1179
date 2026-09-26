import { derived, writable } from 'svelte/store'
import type { Draft } from '../types/draft'
import { db } from '../utils/db'

const draftList = writable<Draft[]>([])
const currentDraftId = writable<string | null>(null)

const currentDraft = derived([draftList, currentDraftId], ([$drafts, $id]) => {
  if (!$id) return null
  return $drafts.find((draft) => draft.id === $id) ?? null
})

async function load(): Promise<void> {
  const records = await db.drafts.toArray()
  records.sort((a, b) => a.genre.localeCompare(b.genre, 'zh-CN') || a.title.localeCompare(b.title, 'zh-CN'))
  draftList.set(records)
}

async function create(input: Omit<Draft, 'id'>): Promise<string> {
  const id = `draft-${crypto.randomUUID()}`
  await db.drafts.add({ id, ...input })
  await load()
  currentDraftId.set(id)
  return id
}

async function update(id: string, changes: Partial<Omit<Draft, 'id'>>): Promise<void> {
  await db.drafts.update(id, changes)
  await load()
}

function select(id: string | null): void {
  currentDraftId.set(id)
}

export const draftStore = {
  subscribe: draftList.subscribe,
  currentDraft,
  currentDraftId: { subscribe: currentDraftId.subscribe },
  load,
  create,
  update,
  select,
}
