import { derived, writable } from 'svelte/store'
import type { Carver } from '../types/carver'
import type { Block } from '../types/block'
import { db } from '../utils/db'

const carverList = writable<Carver[]>([])
const blockAssignments = writable<Record<string, string[]>>({})

const assignmentSummary = derived(blockAssignments, ($assignments) => {
  const summary: Record<string, number> = {}
  for (const blockIds of Object.values($assignments)) {
    for (const blockId of blockIds) {
      summary[blockId] = (summary[blockId] ?? 0) + 1
    }
  }
  return summary
})

function syncAssignments(records: Carver[]): void {
  const assignments: Record<string, string[]> = {}
  for (const carver of records) assignments[carver.id] = [...carver.activeBlockIds]
  blockAssignments.set(assignments)
}

async function load(): Promise<void> {
  const records = await db.carvers.toArray()
  records.sort((a, b) => a.specialty.localeCompare(b.specialty, 'zh-CN') || a.name.localeCompare(b.name, 'zh-CN'))
  carverList.set(records)
  syncAssignments(records)
}

async function create(input: Omit<Carver, 'id'>): Promise<string> {
  const id = `carver-${crypto.randomUUID()}`
  await db.carvers.add({ id, ...input })
  await load()
  return id
}

async function update(id: string, changes: Partial<Omit<Carver, 'id'>>): Promise<void> {
  await db.carvers.update(id, changes)
  await load()
}

async function assignBlock(block: Block, carverId: string): Promise<void> {
  const nextCarver = await db.carvers.get(carverId)
  if (!nextCarver) return

  await db.transaction('rw', db.blocks, db.carvers, async () => {
    const allCarvers = await db.carvers.toArray()
    for (const carver of allCarvers) {
      const withoutBlock = carver.activeBlockIds.filter((id) => id !== block.id)
      if (carver.id === carverId) {
        await db.carvers.update(carver.id, { activeBlockIds: [...withoutBlock, block.id] })
      } else if (withoutBlock.length !== carver.activeBlockIds.length) {
        await db.carvers.update(carver.id, { activeBlockIds: withoutBlock })
      }
    }
    await db.blocks.update(block.id, {
      carvedBy: nextCarver.name,
      state: block.state === '待刻' ? '在刻' : block.state,
    })
  })
  await load()
}

async function releaseBlock(blockId: string): Promise<void> {
  const allCarvers = await db.carvers.toArray()
  await db.transaction('rw', db.carvers, async () => {
    for (const carver of allCarvers) {
      if (!carver.activeBlockIds.includes(blockId)) continue
      await db.carvers.update(carver.id, {
        activeBlockIds: carver.activeBlockIds.filter((id) => id !== blockId),
      })
    }
  })
  await load()
}

export const carverStore = {
  subscribe: carverList.subscribe,
  assignments: { subscribe: blockAssignments.subscribe },
  assignmentSummary,
  load,
  create,
  update,
  assignBlock,
  releaseBlock,
}
