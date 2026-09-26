<script lang="ts">
  import { onMount } from 'svelte'
  import EmptyBox from '../components/common/EmptyBox.svelte'
  import StageRail from '../components/common/StageRail.svelte'
  import { blockStore } from '../stores/blockStore'
  import { carverStore } from '../stores/carverStore'
  import { useCarverLoad } from '../hooks/useCarverLoad'
  import type { CarverSpecialty, SkillLevel } from '../types/carver'
  import { downloadJson } from '../utils/export'
  import { db } from '../utils/db'

  const specialties: CarverSpecialty[] = ['墨线', '套色', '修版']
  const levels: SkillLevel[] = ['学徒', '熟练', '师傅']
  const { activeCount: selectedActiveCount, averageDuration: selectedAverageDuration, refresh: refreshCarverLoad } = useCarverLoad('')

  let filter = $state<CarverSpecialty | '全部'>('全部')
  let selectedCarverId = $state('')
  let showForm = $state(false)
  let name = $state('')
  let specialty = $state<CarverSpecialty>('墨线')
  let skillLevel = $state<SkillLevel>('熟练')
  let pieceworkNote = $state('')
  let formMessage = $state('')

  const filteredCarvers = $derived(
    $carverStore.filter((carver) => filter === '全部' || carver.specialty === filter),
  )
  const selectedCarver = $derived($carverStore.find((carver) => carver.id === selectedCarverId) ?? null)
  const selectedBlocks = $derived(
    selectedCarver
      ? [...$blockStore].filter((block) => selectedCarver.activeBlockIds.includes(block.id) || block.carvedBy === selectedCarver.name)
      : [],
  )

  onMount(() => {
    void Promise.all([blockStore.load(), carverStore.load()])
  })

  $effect(() => {
    const first = $carverStore[0]
    if (!selectedCarverId && first) {
      selectedCarverId = first.id
      void refreshCarverLoad(first.id)
    }
  })

  function openForm(): void {
    showForm = true
    formMessage = ''
  }

  async function submitCarver(): Promise<void> {
    if (!name.trim()) {
      formMessage = '请填写刻工姓名。'
      return
    }
    await carverStore.create({
      name: name.trim(),
      specialty,
      skillLevel,
      activeBlockIds: [],
      pieceworkNote: pieceworkNote.trim() || '计件办法待管事补记',
    })
    name = ''
    specialty = '墨线'
    skillLevel = '熟练'
    pieceworkNote = ''
    formMessage = ''
    showForm = false
  }

  function selectCarver(id: string): void {
    selectedCarverId = id
    void refreshCarverLoad(id)
  }

  function blockStage(): { active: number; completed: number } {
    if (selectedBlocks.some((block) => block.state === '已修版')) return { active: 4, completed: 5 }
    if (selectedBlocks.some((block) => block.state === '在刻')) return { active: 3, completed: 3 }
    if (selectedBlocks.some((block) => block.state === '已刻成')) return { active: 4, completed: 4 }
    return { active: 3, completed: 1 }
  }

  async function exportCarvers(): Promise<void> {
    const [blocks, nodes] = await Promise.all([db.blocks.toArray(), db.nodes.toArray()])
    downloadJson('刻工与版片分布.json', {
      exportedAt: new Date().toISOString(),
      carvers: $carverStore,
      blocks,
      nodes,
    })
  }
</script>

<svelte:head>
  <title>刻工档与版片分布 · 木版年画刻版工序档案</title>
</svelte:head>

<div class="page-heading">
  <div>
    <p class="eyebrow">作坊分工</p>
    <h1>刻工档与在刻版片分布</h1>
    <p>按专长查看刻工负荷，并沿工序轨道掌握在刻位置。</p>
  </div>
  <div class="heading-actions">
    <button class="button ghost" type="button" onclick={exportCarvers}>导出分工档</button>
    <button class="button primary" data-testid="new-carver" type="button" onclick={openForm}>新建刻工</button>
  </div>
</div>

<section class="summary-strip four">
  <div><span>在册刻工</span><strong data-testid="count-carver">{$carverStore.length}</strong></div>
  <div><span>墨线专长</span><strong>{$carverStore.filter((carver) => carver.specialty === '墨线').length}</strong></div>
  <div><span>套色专长</span><strong>{$carverStore.filter((carver) => carver.specialty === '套色').length}</strong></div>
  <div><span>在刻版片</span><strong>{$blockStore.filter((block) => block.state === '在刻').length}</strong></div>
</section>

{#if showForm}
  <section class="panel form-panel" data-testid="form-carver">
    <div class="panel-heading">
      <div>
        <span class="section-kicker">新入档</span>
        <h2>登记刻工专长与计件办法</h2>
      </div>
      <button class="text-button" type="button" onclick={() => (showForm = false)}>收起</button>
    </div>
    <div class="form-grid three">
      <label>
        <span>姓名</span>
        <input data-testid="field-name" bind:value={name} placeholder="刻工姓名" />
      </label>
      <label>
        <span>专长</span>
        <select data-testid="field-specialty" bind:value={specialty}>
          {#each specialties as item}<option value={item}>{item}</option>{/each}
        </select>
      </label>
      <label>
        <span>技艺等级</span>
        <select data-testid="field-skillLevel" bind:value={skillLevel}>
          {#each levels as item}<option value={item}>{item}</option>{/each}
        </select>
      </label>
      <label class="wide">
        <span>计件说明</span>
        <textarea data-testid="field-pieceworkNote" rows="2" bind:value={pieceworkNote} placeholder="按版幅、线密度或修补工作量约定"></textarea>
      </label>
    </div>
    {#if formMessage}<p class="form-message">{formMessage}</p>{/if}
    <div class="form-actions">
      <button class="button primary" data-testid="submit-carver" type="button" onclick={submitCarver}>保存刻工</button>
      <button class="button ghost" type="button" onclick={() => (showForm = false)}>取消</button>
    </div>
  </section>
{/if}

<section class="filter-bar">
  <label>
    <span>按专长</span>
    <select data-testid="filter-specialty" bind:value={filter}>
      <option value="全部">全部专长</option>
      {#each specialties as item}<option value={item}>{item}</option>{/each}
    </select>
  </label>
  <p>当前显示 {filteredCarvers.length} 名刻工</p>
</section>

{#if filteredCarvers.length === 0}
  <EmptyBox title="该专长暂无在册刻工" message="调整筛选条件，或登记一名新的刻工。" actionLabel="新建刻工" onaction={openForm} />
{:else}
  <div class="carver-layout">
    <section class="card-grid carver-grid">
      {#each filteredCarvers as carver (carver.id)}
        <button
          class:active={selectedCarverId === carver.id}
          class="carver-card"
          data-testid="row-carver"
          type="button"
          onclick={() => selectCarver(carver.id)}
        >
          <div class="carver-head">
            <span class="avatar">{carver.name.slice(0, 1)}</span>
            <div>
              <h2>{carver.name}</h2>
              <p>{carver.skillLevel} · {carver.specialty}</p>
            </div>
          </div>
          <div class="carver-metrics">
            <div><span>在刻</span><strong>{carver.activeBlockIds.length}</strong><small>块</small></div>
            <div><span>专长</span><strong>{carver.specialty}</strong></div>
          </div>
          <p class="piece-note">{carver.pieceworkNote}</p>
        </button>
      {/each}
    </section>

    {#if selectedCarver}
      {@const stage = blockStage()}
      <aside class="panel carver-detail">
        <div class="panel-heading">
          <div>
            <span class="section-kicker">当班分布</span>
            <h2>{selectedCarver.name}的版片</h2>
          </div>
          <span class="tag">{selectedCarver.skillLevel}</span>
        </div>
        <div class="load-pair">
          <div><span>在刻版片</span><strong>{$selectedActiveCount}</strong></div>
          <div><span>节点平均耗时</span><strong>{$selectedAverageDuration}<small> 分钟</small></strong></div>
        </div>
        <StageRail activeIndex={stage.active} completedCount={stage.completed} compact={true} />
        <div class="assigned-list">
          {#if selectedBlocks.length === 0}
            <p class="gentle-copy">当前没有指派版片，可在版片编排台分派。</p>
          {:else}
            {#each selectedBlocks as block}
              <div>
                <span>{block.colorNo}</span>
                <strong>{block.blockName}</strong>
                <em>{block.state}</em>
              </div>
            {/each}
          {/if}
        </div>
      </aside>
    {/if}
  </div>
{/if}
