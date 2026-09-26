export type ProcessStage = '起稿' | '勾描' | '上样' | '刻版' | '修版' | '调色' | '套印' | '晾晒'

export interface ProcessNode {
  id: string
  batchId?: string
  blockId?: string
  stage: ProcessStage
  seq: number
  operator: string
  startedAt: string
  durationMin: number
  note: string
}
