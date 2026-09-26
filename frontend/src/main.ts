import { mount } from 'svelte'
import App from './App.svelte'
import './app.css'
import { initializeDatabase } from './utils/db'
import { draftStore } from './stores/draftStore'
import { blockStore } from './stores/blockStore'
import { carverStore } from './stores/carverStore'

/**
 * svelte-spa-router@4 只支持 hash 路由（内部读写 `window.location.hash`）。
 * 为了让「直接访问 /batches、/carvers、/drafts/:id/blocks、/blocks/:id/nodes」
 * 这类真实路径深链也能落到对应页面（而不是一律落到 '*' 兜底），
 * 这里在挂载前把 pathname 深链桥接成 hash 形式：
 *   https://host/carvers  ->  https://host/#/carvers
 * nginx 侧已有 `try_files $uri $uri/ /index.html`，index.html 能正常返回。
 */
function bridgeDeepLink(): void {
  const { pathname, search, hash } = window.location
  if (hash.startsWith('#/')) {
    return
  }
  if (pathname === '/' || pathname === '/index.html') {
    return
  }
  window.history.replaceState(null, '', `/#${pathname}${search}`)
}

async function boot(): Promise<void> {
  bridgeDeepLink()
  try {
    await initializeDatabase()
    await Promise.all([draftStore.load(), blockStore.load(), carverStore.load()])
  } catch {
    // 页面仍会挂载，并由各页空态提示本地数据不可用。
  }

  mount(App, { target: document.getElementById('app')! })
}

void boot()
