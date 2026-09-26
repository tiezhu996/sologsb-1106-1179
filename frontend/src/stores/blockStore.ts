import { derived, writable } from 'svelte/store'
import type { Block } from '../types/block'
import type { DraftStatus } from '../types/draft'
import { db } from '../utils/db'
import { draftStore } from './draftStore'

const blockList = writable<Block[]>([])

export interface DraftBlockStats {
  total: number
  carved: number
  rate: number
}

export function isBlockPrintReady(block: Block): boolean {
  return block.state === '已刻成' || block.state === '已修版'
}

const statsByDraft = derived(blockList, ($blocks) => {
  const stats: Record<string, DraftBlockStats> = {}
  for (const block of $blocks) {
    const current = stats[block.draftId] ?? { total: 0, carved: 0, rate: 0 }
    current.total += 1
    if (isBlockPrintReady(block)) current.carved += 1
    current.rate = current.total === 0 ? 0 : Math.round((current.carved / current.total) * 100)
    stats[block.draftId] = current
  }
  return stats
})

const incompleteByDraft = derived(blockList, ($blocks) => {
  const incomplete: Record<string, Block[]> = {}
  for (const block of $blocks) {
    if (isBlockPrintReady(block)) continue
    const list = incomplete[block.draftId] ?? []
    list.push(block)
    incomplete[block.draftId] = list
  }
  return incomplete
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

function nextStatusFor(status: DraftStatus, allReady: boolean): DraftStatus | null {
  if (allReady && status !== '可印') return '可印'
  if (!allReady && status === '可印') return '刻版中'
  return null
}

async function syncDraftStatus(draftId: string): Promise<void> {
  const [blocks, draft] = await Promise.all([
    db.blocks.where('draftId').equals(draftId).toArray(),
    db.drafts.get(draftId),
  ])
  if (!draft || blocks.length === 0) return

  const next = nextStatusFor(draft.status, blocks.every(isBlockPrintReady))
  if (next) await draftStore.update(draftId, { status: next })
}

async function reconcileDraftStatuses(): Promise<void> {
  const [drafts, blocks] = await Promise.all([db.drafts.toArray(), db.blocks.toArray()])
  const changes: Array<{ id: string; status: DraftStatus }> = []
  for (const draft of drafts) {
    const own = blocks.filter((block) => block.draftId === draft.id)
    if (own.length === 0) continue
    const next = nextStatusFor(draft.status, own.every(isBlockPrintReady))
    if (next) changes.push({ id: draft.id, status: next })
  }
  if (changes.length === 0) return

  await db.transaction('rw', db.drafts, async () => {
    for (const change of changes) {
      await db.drafts.update(change.id, { status: change.status })
    }
  })
  await draftStore.load()
}

export const blockStore = {
  subscribe: blockList.subscribe,
  statsByDraft,
  incompleteByDraft,
  load,
  create,
  update,
  reorder,
  removeByDraft,
  syncDraftStatus,
  reconcileDraftStatuses,
}
