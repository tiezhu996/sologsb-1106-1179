<script lang="ts">
  import { onMount } from 'svelte'
  import { link } from 'svelte-spa-router'
  import ColorSwatch from '../components/common/ColorSwatch.svelte'
  import EmptyBox from '../components/common/EmptyBox.svelte'
  import { draftStore } from '../stores/draftStore'
  import { blockStore } from '../stores/blockStore'
  import { useBlockOrder } from '../hooks/useBlockOrder'
  import type { DraftGenre, DraftStatus, Draft } from '../types/draft'
  import type { PrintBatch } from '../types/batch'
  import { db } from '../utils/db'

  const { blocks: orderedBlocks, carvedRate } = useBlockOrder(null)
  const blockStats = blockStore.statsByDraft

  let genreFilter = $state<DraftGenre | '全部'>('全部')
  let statusFilter = $state<DraftStatus | '全部'>('全部')
  let showForm = $state(false)
  let title = $state('')
  let genre = $state<DraftGenre>('门神')
  let designer = $state('')
  let sizeCm = $state('')
  let paperNote = $state('')
  let status = $state<DraftStatus>('起稿')
  let formMessage = $state('')
  let batches = $state<PrintBatch[]>([])

  const genres: DraftGenre[] = ['门神', '灶王', '戏出', '娃娃']
  const statuses: DraftStatus[] = ['起稿', '分版中', '刻版中', '可印']

  const filteredDrafts = $derived(
    $draftStore.filter((draft) => {
      const genreMatched = genreFilter === '全部' || draft.genre === genreFilter
      const statusMatched = statusFilter === '全部' || draft.status === statusFilter
      return genreMatched && statusMatched
    }),
  )

  const latestBatchByDraft = $derived.by(() => {
    const latest: Record<string, PrintBatch> = {}
    for (const batch of batches) {
      const current = latest[batch.draftId]
      if (!current || batch.printedAt > current.printedAt) latest[batch.draftId] = batch
    }
    return latest
  })

  onMount(() => {
    void Promise.all([draftStore.load(), blockStore.load(), refreshBatches()])
  })

  async function refreshBatches(): Promise<void> {
    batches = await db.batches.toArray()
  }

  function firstBlockColor(draftId: string): number {
    const block = $orderedBlocks.find((item) => item.draftId === draftId)
    return block?.colorNo ?? 1
  }

  function openForm(): void {
    showForm = true
    formMessage = ''
  }

  async function submitDraft(): Promise<void> {
    if (!title.trim() || !designer.trim() || !sizeCm.trim()) {
      formMessage = '请补全画题、起稿人和画心尺寸。'
      return
    }

    const id = await draftStore.create({
      title: title.trim(),
      genre,
      designer: designer.trim(),
      sizeCm: sizeCm.trim(),
      paperNote: paperNote.trim() || '待选纸后补充',
      status,
    })

    const baseColorNames = ['墨线版', '黄版', '红版', '绿版'] as const
    await db.transaction('rw', db.blocks, async () => {
      for (let index = 0; index < baseColorNames.length; index += 1) {
        const blockName = baseColorNames[index]
        if (!blockName) continue
        await db.blocks.add({
          id: `block-${crypto.randomUUID()}`,
          draftId: id,
          blockName,
          colorNo: index + 1,
          woodType: index === 0 ? '黄杨' : '梨木',
          thicknessMm: index === 0 ? 18 : 20,
          carvedBy: '',
          state: '待刻',
          defectNote: '',
        })
      }
    })
    await blockStore.load()

    title = ''
    genre = '门神'
    designer = ''
    sizeCm = ''
    paperNote = ''
    status = '起稿'
    formMessage = ''
    showForm = false
  }

  function genreClass(value: DraftGenre): string {
    return `genre-${genres.indexOf(value)}`
  }

  function statusClass(value: DraftStatus): string {
    return `status-${statuses.indexOf(value)}`
  }

  function draftCardData(draft: Draft) {
    return {
      stats: $blockStats[draft.id] ?? { total: 0, carved: 0, rate: 0 },
      batch: latestBatchByDraft[draft.id],
    }
  }
</script>

<svelte:head>
  <title>画稿总览 · 木版年画刻版工序档案</title>
</svelte:head>

<div class="page-heading">
  <div>
    <p class="eyebrow">画稿与分版</p>
    <h1>画稿总览</h1>
    <p>掌握每张年画的题材、分版进度与最近试印记录。</p>
  </div>
  <button class="button primary" data-testid="new-draft" type="button" onclick={openForm}>新建画稿</button>
</div>

<section class="summary-strip" aria-label="档案概况">
  <div><span>在册画稿</span><strong data-testid="count-draft">{$draftStore.length}</strong></div>
  <div><span>全馆版片</span><strong>{$orderedBlocks.length}</strong></div>
  <div><span>总体刻成率</span><strong>{$carvedRate}%</strong></div>
  <div><span>登记批次</span><strong>{batches.length}</strong></div>
</section>

{#if showForm}
  <section class="panel form-panel" data-testid="form-draft">
    <div class="panel-heading">
      <div>
        <span class="section-kicker">新立画稿</span>
        <h2>登记画心与起稿信息</h2>
      </div>
      <button class="text-button" type="button" onclick={() => (showForm = false)}>收起</button>
    </div>

    <div class="form-grid">
      <label>
        <span>画题</span>
        <input data-testid="field-title" bind:value={title} placeholder="如：五子夺莲" />
      </label>
      <label>
        <span>题材</span>
        <select data-testid="field-genre" bind:value={genre}>
          {#each genres as item}<option value={item}>{item}</option>{/each}
        </select>
      </label>
      <label>
        <span>起稿人</span>
        <input data-testid="field-designer" bind:value={designer} placeholder="填写画师或画坊" />
      </label>
      <label>
        <span>画心尺寸</span>
        <input data-testid="field-sizeCm" bind:value={sizeCm} placeholder="如：45 × 32 cm" />
      </label>
      <label class="wide">
        <span>用纸说明</span>
        <textarea data-testid="field-paperNote" bind:value={paperNote} rows="2" placeholder="纸名、纸质与托裱方式"></textarea>
      </label>
      <label>
        <span>当前状态</span>
        <select data-testid="field-status" bind:value={status}>
          {#each statuses as item}<option value={item}>{item}</option>{/each}
        </select>
      </label>
    </div>

    {#if formMessage}<p class="form-message">{formMessage}</p>{/if}
    <div class="form-actions">
      <button class="button primary" data-testid="submit-draft" type="button" onclick={submitDraft}>保存画稿</button>
      <button class="button ghost" type="button" onclick={() => (showForm = false)}>取消</button>
    </div>
  </section>
{/if}

<section class="filter-bar" aria-label="画稿筛选">
  <label>
    <span>按题材</span>
    <select data-testid="filter-genre" bind:value={genreFilter}>
      <option value="全部">全部题材</option>
      {#each genres as item}<option value={item}>{item}</option>{/each}
    </select>
  </label>
  <label>
    <span>按状态</span>
    <select data-testid="filter-status" bind:value={statusFilter}>
      <option value="全部">全部状态</option>
      {#each statuses as item}<option value={item}>{item}</option>{/each}
    </select>
  </label>
  <p>当前显示 {filteredDrafts.length} 张画稿</p>
</section>

{#if filteredDrafts.length === 0}
  <EmptyBox
    title="这一筛选中暂无画稿"
    message="调整题材或状态，或先登记一张新画稿，再进入分版编排。"
    actionLabel="新建画稿"
    onaction={openForm}
  />
{:else}
  <section class="card-grid">
    {#each filteredDrafts as draft (draft.id)}
      {@const data = draftCardData(draft)}
      <article class="draft-card" data-testid="row-draft">
        <div class="card-topline">
          <span class="tag genre-tag {genreClass(draft.genre)}">
            {draft.genre}
          </span>
          <span class="tag status-tag {statusClass(draft.status)}">{draft.status}</span>
        </div>

        <div class="title-line">
          <ColorSwatch colorNo={firstBlockColor(draft.id)} />
          <h2>{draft.title}</h2>
        </div>

        <dl class="meta-list">
          <div><dt>起稿</dt><dd>{draft.designer}</dd></div>
          <div><dt>画心</dt><dd>{draft.sizeCm}</dd></div>
          <div><dt>用纸</dt><dd>{draft.paperNote}</dd></div>
        </dl>

        <div class="progress-block">
          <div class="progress-label"><span>版片进度</span><strong>{data.stats.carved}/{data.stats.total}</strong></div>
          <div class="progress-track"><i style={`width: ${data.stats.rate}%`}></i></div>
          <small>刻成率 {data.stats.rate}%</small>
        </div>

        <div class="latest-batch">
          <span>最近批次</span>
          {#if data.batch}
            <strong>{data.batch.batchNo}</strong>
            <small>{data.batch.printedAt.replace(/-/g, '.')} · 印 {data.batch.qty} 张</small>
          {:else}
            <strong>尚未试印</strong>
            <small>版片齐备后可登记首批</small>
          {/if}
        </div>

        <a class="button secondary" use:link href={`/drafts/${draft.id}/blocks`}>进入版片编排台</a>
      </article>
    {/each}
  </section>
{/if}
