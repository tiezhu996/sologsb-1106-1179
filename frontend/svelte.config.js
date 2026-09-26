import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  // 说明：不能全局强制 compilerOptions.runes = true。
  // 依赖 svelte-spa-router@4 的 Router.svelte 是 legacy 组件（用到 afterUpdate /
  // createEventDispatcher），在 runes 模式下会报
  // "afterUpdate cannot be used in runes mode" 导致构建失败。
  // Svelte 5 默认按组件自动判定：本项目自有组件全部使用 runes（$state/$derived/$props），
  // 依赖里的 legacy 组件保持 legacy 模式，两者可互操作。
  preprocess: vitePreprocess()
}
