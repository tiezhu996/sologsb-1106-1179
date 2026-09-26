import { derived, get, writable } from 'svelte/store'
import type { Block } from '../types/block'
import { db } from '../utils/db'
import { draftStore } from './draftStore'

const blockList = writable<Block[]>([])

export interface DraftBlockStats {
  total: number
  carved: number
  rate: number
}

export function isBlockReady(block: Block): boolean {
  return block.state === '已刻成' || block.state === '已修版'
}

function groupBlocksByDraft(blocks: Block[]): Record<string, Block[]> {
  const grouped: Record<string, Block[]> = {}
  for (const block of blocks) {
    ;(grouped[block.draftId] ??= []).push(block)
  }
  return grouped
}

const statsByDraft = derived(blockList, ($blocks) => {
  const stats: Record<string, DraftBlockStats> = {}
  for (const block of $blocks) {
    const current = stats[block.draftId] ?? { total: 0, carved: 0, rate: 0 }
    current.total += 1
    if (isBlockReady(block)) current.carved += 1
    current.rate = current.total === 0 ? 0 : Math.round((current.carved / current.total) * 100)
    stats[block.draftId] = current
  }
  return stats
})

// 版片未全部刻成或修好的画稿 -> 还差的版片清单
const uncarvedByDraft = derived(blockList, ($blocks) => {
  const uncarved: Record<string, Block[]> = {}
  for (const block of $blocks) {
    if (isBlockReady(block)) continue
    ;(uncarved[block.draftId] ??= []).push(block)
  }
  return uncarved
})

// 名下至少有一块版片、且全部刻成或修好的画稿才可登记试印批次
const printReadyByDraft = derived(blockList, ($blocks) => {
  const ready: Record<string, boolean> = {}
  for (const [draftId, draftBlocks] of Object.entries(groupBlocksByDraft($blocks))) {
    ready[draftId] = draftBlocks.length > 0 && draftBlocks.every(isBlockReady)
  }
  return ready
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

// 按版片现状重算画稿状态：有版片退回在刻即退回刻版中，全部重新刻成则自动恢复可印
async function syncDraftStatus(draftId: string): Promise<void> {
  const draftBlocks = get(blockList).filter((block) => block.draftId === draftId)
  if (draftBlocks.length === 0) return
  const printReady = draftBlocks.every(isBlockReady)
  await draftStore.update(draftId, { status: printReady ? '可印' : '刻版中' })
}

async function removeByDraft(draftId: string): Promise<void> {
  await db.blocks.where('draftId').equals(draftId).delete()
  await load()
}

export const blockStore = {
  subscribe: blockList.subscribe,
  statsByDraft,
  uncarvedByDraft,
  printReadyByDraft,
  load,
  create,
  update,
  syncDraftStatus,
  reorder,
  removeByDraft,
}
