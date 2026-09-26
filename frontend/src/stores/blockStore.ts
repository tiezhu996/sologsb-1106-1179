import { derived, writable } from 'svelte/store'
import type { Block } from '../types/block'
import { db } from '../utils/db'

const blockList = writable<Block[]>([])

export interface DraftBlockStats {
  total: number
  carved: number
  rate: number
}

const statsByDraft = derived(blockList, ($blocks) => {
  const stats: Record<string, DraftBlockStats> = {}
  for (const block of $blocks) {
    const current = stats[block.draftId] ?? { total: 0, carved: 0, rate: 0 }
    current.total += 1
    if (block.state === '已刻成' || block.state === '已修版') current.carved += 1
    current.rate = current.total === 0 ? 0 : Math.round((current.carved / current.total) * 100)
    stats[block.draftId] = current
  }
  return stats
})

async function load(): Promise<void> {
  const records = await db.blocks.toArray()
  records.sort((a, b) => a.draftId.localeCompare(b.draftId) || a.colorNo - b.colorNo)
  blockList.set(records)
}

async function create(input: Omit<Block, 'id'>): Promise<string> {
  const id = `block-${crypto.randomUUID()}`
  await db.blocks.add({ id, ...input })
  await load()
  return id
}

async function update(id: string, changes: Partial<Omit<Block, 'id'>>): Promise<void> {
  await db.blocks.update(id, changes)
  await load()
}

async function reorder(ordered: Array<Pick<Block, 'id' | 'colorNo'>>): Promise<void> {
  await db.transaction('rw', db.blocks, async () => {
    for (const item of ordered) {
      await db.blocks.update(item.id, { colorNo: item.colorNo })
    }
  })
  await load()
}

async function removeByDraft(draftId: string): Promise<void> {
  await db.blocks.where('draftId').equals(draftId).delete()
  await load()
}

export const blockStore = {
  subscribe: blockList.subscribe,
  statsByDraft,
  load,
  create,
  update,
  reorder,
  removeByDraft,
}
