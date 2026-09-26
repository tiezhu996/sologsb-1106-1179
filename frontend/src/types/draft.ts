export type DraftGenre = '门神' | '灶王' | '戏出' | '娃娃'
export type DraftStatus = '起稿' | '分版中' | '刻版中' | '可印'

export interface Draft {
  id: string
  title: string
  genre: DraftGenre
  designer: string
  sizeCm: string
  paperNote: string
  status: DraftStatus
}
