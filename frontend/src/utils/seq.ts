export interface SequenceCheck {
  valid: boolean
  duplicates: number[]
  gaps: number[]
}

export function validateColorSequence(values: number[]): SequenceCheck {
  const sorted = [...values].sort((a, b) => a - b)
  const seen = new Set<number>()
  const duplicates = new Set<number>()

  for (const value of sorted) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }

  const gaps: number[] = []
  for (let expected = 1; expected <= sorted.length; expected += 1) {
    if (!seen.has(expected)) gaps.push(expected)
  }

  return {
    valid: duplicates.size === 0 && gaps.length === 0,
    duplicates: [...duplicates],
    gaps,
  }
}

export function formatColorDeviation(blockName: string, deviation: string): string {
  const clean = deviation.trim() || '未见偏差'
  return `${blockName}：${clean}`
}

export function buildDeviationNote(entries: Array<{ blockName: string; deviation: string }>): string {
  if (entries.length === 0) return '未登记逐版偏差'
  return entries.map(({ blockName, deviation }) => formatColorDeviation(blockName, deviation)).join('；')
}
