<script lang="ts">
  import { onMount } from 'svelte'
  import { link, params } from 'svelte-spa-router'
  import EmptyBox from '../components/common/EmptyBox.svelte'
  import StageRail from '../components/common/StageRail.svelte'
  import { blockStore } from '../stores/blockStore'
  import { db } from '../utils/db'
  import type { ProcessNode, ProcessStage } from '../types/node'

  const stages: ProcessStage[] = ['起稿', '勾描', '上样', '刻版', '修版', '调色', '套印', '晾晒']
  const blockId = $derived($params?.id ?? '')
  const block = $derived($blockStore.find((item) => item.id === blockId) ?? null)

  let nodes = $state<ProcessNode[]>([])
  let operator = $state('')
  let durationMin = $state(60)
  let note = $state('')
  let feedback = $state('')

  function latestNode(): ProcessNode | null {
    const sorted = [...nodes].sort((a, b) => a.seq - b.seq)
    return sorted[sorted.length - 1] ?? null
  }

  const activeIndex = $derived.by(() => {
    const latest = latestNode()
    return latest ? Math.max(0, latest.seq - 1) : 0
  })

  const nextStage = $derived(stages.find((stage) => !nodes.some((node) => node.stage === stage)) ?? null)

  onMount(() => {
    void Promise.all([blockStore.load(), loadNodes()])
  })

  $effect(() => {
    if (block && !operator) operator = block.carvedBy
  })

  async function loadNodes(): Promise<void> {
    const records = await db.nodes.where('blockId').equals(blockId).toArray()
    records.sort((a, b) => a.seq - b.seq)
    nodes = records
    const last = records[records.length - 1]
    if (last) durationMin = last.durationMin
  }

  async function advanceNode(): Promise<void> {
    if (!nextStage || !block) return
    if (!operator.trim()) {
      feedback = '请先填写操作人。'
      return
    }

    const overflow = stages.indexOf(nextStage) + 1 < nodes.length
    if (overflow) {
      feedback = '节点顺序与阶段轨道不一致，请先回退重排。'
      return
    }

    await db.nodes.add({
      id: `node-${crypto.randomUUID()}`,
      blockId: block.id,
      stage: nextStage,
      seq: nodes.length + 1,
      operator: operator.trim(),
      startedAt: new Date().toISOString().slice(0, 16),
      durationMin: Math.max(0, Number(durationMin)),
      note: note.trim() || `${nextStage}工序登记`,
    })
    note = ''
    feedback = `已推进到${nextStage}`
    await loadNodes()
  }

  async function retreatNode(): Promise<void> {
    const latest = latestNode()
    if (!latest) {
      feedback = '当前没有可回退的节点。'
      return
    }
    await db.nodes.delete(latest.id)
    feedback = `已回退${latest.stage}节点`
    await loadNodes()
  }

  async function updateDuration(): Promise<void> {
    const latest = latestNode()
    if (!latest) {
      feedback = '登记工序节点后才能记录耗时。'
      return
    }
    await db.nodes.update(latest.id, { durationMin: Math.max(0, Number(durationMin)) })
    feedback = `已登记${latest.stage}耗时 ${durationMin} 分钟`
    await loadNodes()
  }

  async function returnToStage(index: number, stage: ProcessStage): Promise<void> {
    const deleteIds = nodes.filter((node) => node.seq > index + 1).map((node) => node.id)
    if (deleteIds.length > 0) {
      await db.nodes.bulkDelete(deleteIds)
      feedback = `节点已回退到${stage}`
      await loadNodes()
    }
  }

  function formatTime(value: string): string {
    return value.replace('T', ' ')
  }
</script>

<svelte:head>
  <title>工序节点时间线 · 木版年画刻版工序档案</title>
</svelte:head>

{#if !block}
  <div class="page-heading">
    <div><p class="eyebrow">单块版片工序</p><h1>工序节点时间线</h1><p>正在读取版片与节点档案。</p></div>
  </div>
  <EmptyBox title="未找到这块版片" message="版片档案尚未载入，请从画稿总览重新进入。" />
  <a class="button secondary" use:link href="/drafts">返回画稿总览</a>
{:else}
  <div class="page-heading" data-testid="detail-node">
    <div>
      <p class="eyebrow">单块版片工序</p>
      <h1>{block.blockName}工序节点时间线</h1>
      <p>{block.woodType} · 版厚 {block.thicknessMm} mm · 当前 {block.state}</p>
    </div>
    <a class="button ghost" use:link href={`/drafts/${block.draftId}/blocks`}>返回版片编排台</a>
  </div>

  <section class="panel">
    <div class="panel-heading">
      <div>
        <span class="section-kicker">阶段轨道</span>
        <h2>沿工序逐节点留档</h2>
      </div>
      <span class="tag state-{block.state}">{block.state}</span>
    </div>
    <StageRail activeIndex={activeIndex} completedCount={nodes.length} onselect={returnToStage} />
  </section>

  <div class="timeline-grid">
    <section class="panel form-panel">
      <div class="panel-heading">
        <div>
          <span class="section-kicker">{nextStage ? '下一节点' : '节点齐备'}</span>
          <h2>{nextStage ? `登记${nextStage}环节` : '全部阶段已登记'}</h2>
        </div>
      </div>

      {#if nextStage}
        <div class="form-grid">
          <label>
            <span>操作人</span>
            <input data-testid="field-node-operator" bind:value={operator} placeholder="刻工或画师姓名" />
          </label>
          <label>
            <span>本次耗时（分钟）</span>
            <input data-testid="field-node-duration" type="number" min="0" bind:value={durationMin} />
          </label>
          <label class="wide">
            <span>工序记录</span>
            <textarea data-testid="field-node-note" rows="3" bind:value={note} placeholder="记刀路、试印或修补要点"></textarea>
          </label>
        </div>
        <button class="button primary" data-testid="submit-node" type="button" onclick={advanceNode}>推进到{nextStage}</button>
      {:else}
        <p class="gentle-copy">当前版片已登记全部阶段，可回退节点后重新记录。</p>
      {/if}

      <div class="inline-actions">
        <button class="button secondary" type="button" onclick={updateDuration}>更新末节点耗时</button>
        <button class="button danger" type="button" onclick={retreatNode}>回退一个节点</button>
      </div>
      {#if feedback}<p class="notice">{feedback}</p>{/if}
    </section>

    <section class="panel timeline-panel">
      <div class="panel-heading">
        <div>
          <span class="section-kicker">已存节点</span>
          <h2>工序往来</h2>
        </div>
        <strong>{nodes.length} 条</strong>
      </div>

      {#if nodes.length === 0}
        <EmptyBox title="尚未登记节点" message="从上方的下一阶段开始记录操作人、耗时与工序要点。" />
      {:else}
        <ol class="timeline-list">
          {#each [...nodes].sort((a, b) => b.seq - a.seq) as node}
            <li>
              <span class="timeline-dot"></span>
              <div>
                <div class="timeline-title"><strong>{node.stage}</strong><span>第 {node.seq} 节点</span></div>
                <p>{node.note}</p>
                <small>{node.operator} · {formatTime(node.startedAt)} · {node.durationMin} 分钟</small>
              </div>
            </li>
          {/each}
        </ol>
      {/if}
    </section>
  </div>
{/if}
