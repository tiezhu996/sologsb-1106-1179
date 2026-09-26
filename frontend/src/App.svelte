<script lang="ts">
  import { onMount } from 'svelte'
  import Router, { link } from 'svelte-spa-router'
  import routes from './router'
  import { draftStore } from './stores/draftStore'
  import { blockStore } from './stores/blockStore'
  import { carverStore } from './stores/carverStore'

  const firstDraftPath = $derived(`/drafts/${$draftStore[0]?.id ?? 'draft-menshen-qin'}/blocks`)
  const firstBlockPath = $derived(`/blocks/${$blockStore[0]?.id ?? 'block-ms-01'}/nodes`)

  onMount(() => {
    void Promise.all([draftStore.load(), blockStore.load(), carverStore.load()])
  })
</script>

<div class="app-shell">
  <header class="site-header">
    <a class="brand" use:link href="/drafts" aria-label="回到画稿总览">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path d="M12 13h40v38H12z" fill="none" stroke="currentColor" stroke-width="3" />
        <path d="M19 21h26M19 29h20M19 37h26M19 45h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        <path d="m39 43 5 5 9-12" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span><strong>版簿</strong><small>木版年画刻版工序档案</small></span>
    </a>

    <nav aria-label="主导航">
      <a use:link href="/drafts">画稿总览</a>
      <a use:link href={firstDraftPath}>版片编排</a>
      <a use:link href={firstBlockPath}>工序时间线</a>
      <a use:link href="/batches">印制批次</a>
      <a use:link href="/carvers">刻工档</a>
    </nav>
  </header>

  <main>
    <Router {routes} />
  </main>

  <footer>
    <span>版簿 · 本地工序档案</span>
    <span>数据仅存于当前浏览器</span>
  </footer>
</div>
