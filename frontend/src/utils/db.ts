import Dexie, { type Table } from 'dexie'
import type { Draft } from '../types/draft'
import type { Block } from '../types/block'
import type { Carver } from '../types/carver'
import type { PrintBatch } from '../types/batch'
import type { ProcessNode } from '../types/node'

type StoredRecord = Record<string, unknown> & { schemaRev?: number }

class WoodprintDatabase extends Dexie {
  drafts!: Table<Draft, string>
  blocks!: Table<Block, string>
  carvers!: Table<Carver, string>
  batches!: Table<PrintBatch, string>
  nodes!: Table<ProcessNode, string>

  constructor() {
    super('gbwoodprint-db')

    this.version(1).stores({
      drafts: 'id, genre, status, title',
      blocks: 'id, draftId, colorNo, carvedBy, state',
      carvers: 'id, specialty, skillLevel, name',
      batches: 'id, draftId, batchNo, printedAt',
      nodes: 'id, batchId, blockId, stage, seq, operator',
    })

    this.version(2)
      .stores({
        drafts: 'id, genre, status, title, schemaRev',
        blocks: 'id, draftId, colorNo, carvedBy, state, schemaRev',
        carvers: 'id, specialty, skillLevel, name, schemaRev',
        batches: 'id, draftId, batchNo, printedAt, schemaRev',
        nodes: 'id, batchId, blockId, stage, seq, operator, schemaRev',
      })
      .upgrade(async (transaction) => {
        const tableNames = ['drafts', 'blocks', 'carvers', 'batches', 'nodes'] as const
        for (const tableName of tableNames) {
          await transaction.table(tableName).toCollection().modify((record: StoredRecord) => {
            record.schemaRev = 2
          })
        }
      })
  }
}

const drafts: Draft[] = [
  {
    id: 'draft-menshen-qin',
    title: '秦琼敬德',
    genre: '门神',
    designer: '赵守艺',
    sizeCm: '52 × 36 cm',
    paperNote: '泾县四尺单宣，画心托一层薄棉纸',
    status: '刻版中',
  },
  {
    id: 'draft-zaowang-siming',
    title: '灶王司命',
    genre: '灶王',
    designer: '韩玉芹',
    sizeCm: '38 × 26 cm',
    paperNote: '朱签纸，农历腊月前备足两批',
    status: '分版中',
  },
  {
    id: 'draft-muke-zhai',
    title: '穆柯寨',
    genre: '戏出',
    designer: '岳文山',
    sizeCm: '46 × 32 cm',
    paperNote: '竹浆混宣，吸水适中，适合四色套印',
    status: '起稿',
  },
  {
    id: 'draft-liannian-youyu',
    title: '莲年有余',
    genre: '娃娃',
    designer: '许锦堂',
    sizeCm: '40 × 30 cm',
    paperNote: '绵竹手工纸，纸边需压平后上版',
    status: '可印',
  },
]

const blocks: Block[] = [
  { id: 'block-ms-01', draftId: 'draft-menshen-qin', blockName: '墨线版', colorNo: 1, woodType: '黄杨', thicknessMm: 18, carvedBy: '齐师傅', state: '已刻成', defectNote: '胡须末梢修补一处，不影响线条落墨。' },
  { id: 'block-ms-02', draftId: 'draft-menshen-qin', blockName: '黄版', colorNo: 2, woodType: '梨木', thicknessMm: 20, carvedBy: '周桂枝', state: '在刻', defectNote: '甲胄边线有一处浅崩口，已做嵌补。' },
  { id: 'block-ms-03', draftId: 'draft-menshen-qin', blockName: '红版', colorNo: 3, woodType: '梨木', thicknessMm: 20, carvedBy: '陈小满', state: '待刻', defectNote: '' },
  { id: 'block-ms-04', draftId: 'draft-menshen-qin', blockName: '绿版', colorNo: 4, woodType: '梨木', thicknessMm: 19, carvedBy: '秦木生', state: '待刻', defectNote: '' },

  { id: 'block-zw-01', draftId: 'draft-zaowang-siming', blockName: '墨线版', colorNo: 1, woodType: '黄杨', thicknessMm: 16, carvedBy: '秦木生', state: '已刻成', defectNote: '灶君衣纹清晰，无补版。' },
  { id: 'block-zw-02', draftId: 'draft-zaowang-siming', blockName: '黄版', colorNo: 2, woodType: '梨木', thicknessMm: 18, carvedBy: '周桂枝', state: '在刻', defectNote: '供桌纹样局部跳刀，已顺线修平。' },
  { id: 'block-zw-03', draftId: 'draft-zaowang-siming', blockName: '红版', colorNo: 3, woodType: '梨木', thicknessMm: 18, carvedBy: '陈小满', state: '待刻', defectNote: '' },
  { id: 'block-zw-04', draftId: 'draft-zaowang-siming', blockName: '绿版', colorNo: 4, woodType: '梨木', thicknessMm: 17, carvedBy: '秦木生', state: '待刻', defectNote: '' },

  { id: 'block-mk-01', draftId: 'draft-muke-zhai', blockName: '墨线版', colorNo: 1, woodType: '黄杨', thicknessMm: 17, carvedBy: '齐师傅', state: '在刻', defectNote: '旗面转折处留刀待修。' },
  { id: 'block-mk-02', draftId: 'draft-muke-zhai', blockName: '黄版', colorNo: 2, woodType: '梨木', thicknessMm: 20, carvedBy: '周桂枝', state: '待刻', defectNote: '' },
  { id: 'block-mk-03', draftId: 'draft-muke-zhai', blockName: '红版', colorNo: 3, woodType: '梨木', thicknessMm: 20, carvedBy: '陈小满', state: '待刻', defectNote: '' },
  { id: 'block-mk-04', draftId: 'draft-muke-zhai', blockName: '绿版', colorNo: 4, woodType: '梨木', thicknessMm: 19, carvedBy: '秦木生', state: '待刻', defectNote: '' },

  { id: 'block-ll-01', draftId: 'draft-liannian-youyu', blockName: '墨线版', colorNo: 1, woodType: '黄杨', thicknessMm: 16, carvedBy: '齐师傅', state: '已修版', defectNote: '鱼鳞线加修一次，边缘改圆顺。' },
  { id: 'block-ll-02', draftId: 'draft-liannian-youyu', blockName: '黄版', colorNo: 2, woodType: '梨木', thicknessMm: 18, carvedBy: '周桂枝', state: '已刻成', defectNote: '荷叶边缘有针尖小孔，不影响印面。' },
  { id: 'block-ll-03', draftId: 'draft-liannian-youyu', blockName: '红版', colorNo: 3, woodType: '梨木', thicknessMm: 18, carvedBy: '陈小满', state: '已刻成', defectNote: '无补版。' },
  { id: 'block-ll-04', draftId: 'draft-liannian-youyu', blockName: '绿版', colorNo: 4, woodType: '梨木', thicknessMm: 18, carvedBy: '秦木生', state: '已刻成', defectNote: '青绿地留白平净。' },
]

const carvers: Carver[] = [
  {
    id: 'carver-qi',
    name: '齐师傅',
    specialty: '墨线',
    skillLevel: '师傅',
    activeBlockIds: ['block-mk-01'],
    pieceworkNote: '主刻人物面部与衣纹，按成版幅面计件，修版另计。',
  },
  {
    id: 'carver-zhou',
    name: '周桂枝',
    specialty: '套色',
    skillLevel: '熟练',
    activeBlockIds: ['block-ms-02', 'block-zw-02'],
    pieceworkNote: '擅刻花叶与织物底纹，每版完成后交管事验线。',
  },
  {
    id: 'carver-chen',
    name: '陈小满',
    specialty: '套色',
    skillLevel: '学徒',
    activeBlockIds: [],
    pieceworkNote: '跟随周师傅学刻色块，先从平底大面积练起。',
  },
  {
    id: 'carver-qin',
    name: '秦木生',
    specialty: '修版',
    skillLevel: '师傅',
    activeBlockIds: [],
    pieceworkNote: '负责旧版补线、嵌木与压平，按修补面积计件。',
  },
]

const batches: PrintBatch[] = [
  {
    id: 'batch-ll-001',
    draftId: 'draft-liannian-youyu',
    batchNo: '莲鱼-甲辰-01',
    printedAt: '2026-01-18',
    paperBatch: '绵竹-2601',
    inkNote: '矿物黄加桃胶，红料略减胶，绿料保持原稠度。',
    qty: 480,
    pieceCount: 4,
    qcNote: '墨线版：线条饱满；黄版：右下荷叶略轻；红版：娃娃衣襟套准；绿版：未见走版。',
  },
  {
    id: 'batch-ll-002',
    draftId: 'draft-liannian-youyu',
    batchNo: '莲鱼-甲辰-02',
    printedAt: '2026-02-06',
    paperBatch: '绵竹-2603',
    inkNote: '黄料补入少量藤黄，红料调薄半成。',
    qty: 320,
    pieceCount: 4,
    qcNote: '墨线版：清晰；黄版：套准；红版：左肩偏差约半线；绿版：荷叶边略重。',
  },
  {
    id: 'batch-ms-001',
    draftId: 'draft-menshen-qin',
    batchNo: '门神-试印-01',
    printedAt: '2026-02-20',
    paperBatch: '泾县-2602',
    inkNote: '烟墨加骨胶，黄料以赭石压调。',
    qty: 120,
    pieceCount: 2,
    qcNote: '墨线版：样张无断线；黄版：肩甲外侧出现轻微走版，已重校定位。',
  },
]

const nodes: ProcessNode[] = [
  { id: 'node-ms-01', blockId: 'block-ms-01', stage: '起稿', seq: 1, operator: '赵守艺', startedAt: '2026-01-02T08:30', durationMin: 180, note: '确定秦琼、敬德左右对称构图。' },
  { id: 'node-ms-02', blockId: 'block-ms-01', stage: '勾描', seq: 2, operator: '赵守艺', startedAt: '2026-01-03T09:00', durationMin: 240, note: '墨线稿过朱，甲片分界加密。' },
  { id: 'node-ms-03', blockId: 'block-ms-01', stage: '上样', seq: 3, operator: '齐师傅', startedAt: '2026-01-04T08:30', durationMin: 95, note: '画稿反贴黄杨板，糨层均匀。' },
  { id: 'node-ms-04', blockId: 'block-ms-01', stage: '刻版', seq: 4, operator: '齐师傅', startedAt: '2026-01-05T07:50', durationMin: 760, note: '人物面部先刻，衣纹随后分层推进。' },
  { id: 'node-ms-05', blockId: 'block-ms-01', stage: '修版', seq: 5, operator: '秦木生', startedAt: '2026-01-09T13:20', durationMin: 130, note: '补胡须末梢，试印后调整两处刀口。' },
  { id: 'node-zw-01', blockId: 'block-zw-01', stage: '起稿', seq: 1, operator: '韩玉芹', startedAt: '2026-01-12T08:20', durationMin: 170, note: '按灶王传统形制布置神位与供养人物。' },
  { id: 'node-zw-02', blockId: 'block-zw-01', stage: '勾描', seq: 2, operator: '韩玉芹', startedAt: '2026-01-13T08:40', durationMin: 210, note: '整理胡须与云纹，减少密线交叠。' },
  { id: 'node-zw-03', blockId: 'block-zw-01', stage: '上样', seq: 3, operator: '秦木生', startedAt: '2026-01-14T09:10', durationMin: 85, note: '画稿上板，四角定位。' },
  { id: 'node-zw-04', blockId: 'block-zw-01', stage: '刻版', seq: 4, operator: '秦木生', startedAt: '2026-01-15T07:40', durationMin: 690, note: '先刻神像轮廓，再收桌面直线。' },
  { id: 'node-mk-01', blockId: 'block-mk-01', stage: '起稿', seq: 1, operator: '岳文山', startedAt: '2026-02-01T09:00', durationMin: 200, note: '选取穆桂英点将一幕，突出旗阵。' },
  { id: 'node-mk-02', blockId: 'block-mk-01', stage: '勾描', seq: 2, operator: '岳文山', startedAt: '2026-02-02T08:30', durationMin: 185, note: '戏台身段转为年画正面构图。' },
  { id: 'node-mk-03', blockId: 'block-mk-01', stage: '上样', seq: 3, operator: '齐师傅', startedAt: '2026-02-03T08:20', durationMin: 90, note: '旗面折线以淡朱定位。' },
  { id: 'node-ll-01', blockId: 'block-ll-01', stage: '刻版', seq: 1, operator: '齐师傅', startedAt: '2025-12-08T08:00', durationMin: 620, note: '娃娃轮廓与抱鱼线条一次成版。' },
  { id: 'node-ll-02', blockId: 'block-ll-01', stage: '修版', seq: 2, operator: '秦木生', startedAt: '2025-12-11T14:00', durationMin: 110, note: '鱼鳞线加修，边缘改圆顺。' },
]

function withSchemaRevision<T extends object>(records: T[]): Array<T & { schemaRev: number }> {
  return records.map((record) => ({ ...record, schemaRev: 2 }))
}

export const db = new WoodprintDatabase()

db.on('populate', () => {
  return Promise.all([
    db.drafts.bulkAdd(withSchemaRevision(drafts)),
    db.blocks.bulkAdd(withSchemaRevision(blocks)),
    db.carvers.bulkAdd(withSchemaRevision(carvers)),
    db.batches.bulkAdd(withSchemaRevision(batches)),
    db.nodes.bulkAdd(withSchemaRevision(nodes)),
  ])
})

export async function initializeDatabase(): Promise<void> {
  await db.open()
  const draftCount = await db.drafts.count()
  if (draftCount > 0) return

  await db.transaction('rw', db.drafts, db.blocks, db.carvers, db.batches, db.nodes, async () => {
    await db.drafts.bulkPut(withSchemaRevision(drafts))
    await db.blocks.bulkPut(withSchemaRevision(blocks))
    await db.carvers.bulkPut(withSchemaRevision(carvers))
    await db.batches.bulkPut(withSchemaRevision(batches))
    await db.nodes.bulkPut(withSchemaRevision(nodes))
  })
}

export type { WoodprintDatabase }
