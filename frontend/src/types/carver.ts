export type CarverSpecialty = '墨线' | '套色' | '修版'
export type SkillLevel = '学徒' | '熟练' | '师傅'

export interface Carver {
  id: string
  name: string
  specialty: CarverSpecialty
  skillLevel: SkillLevel
  activeBlockIds: string[]
  pieceworkNote: string
}
