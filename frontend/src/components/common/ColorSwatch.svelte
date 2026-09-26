<script lang="ts">
  import type { BlockName } from '../../types/block'

  interface Props {
    colorNo: number
    blockName?: BlockName
    size?: 'small' | 'regular'
  }

  let { colorNo, blockName, size = 'regular' }: Props = $props()

  const colorByBlock: Record<BlockName, string> = {
    墨线版: '#25211d',
    黄版: '#d9a11b',
    红版: '#c53b2d',
    绿版: '#2f7658',
  }

  const colorNoMap: Record<number, string> = {
    1: '#25211d',
    2: '#d9a11b',
    3: '#c53b2d',
    4: '#2f7658',
  }

  const color = $derived(blockName ? colorByBlock[blockName] : (colorNoMap[colorNo] ?? '#8e6b3f'))
</script>

<span class:small={size === 'small'} class="color-swatch" title={`套色序号 ${colorNo}`}>
  <span class="swatch-chip" style={`--swatch-color: ${color}`}></span>
  <span class="swatch-number">色序 {colorNo}</span>
  {#if blockName}<span class="swatch-label">{blockName}</span>{/if}
</span>

<style>
  .color-swatch {
    display: inline-flex;
    align-items: center;
    gap: 0.42rem;
    white-space: nowrap;
    color: var(--ink-soft);
    font-size: 0.86rem;
  }

  .swatch-chip {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: var(--swatch-color);
    border: 2px solid rgba(255, 255, 255, 0.82);
    box-shadow: 0 0 0 1px rgba(56, 42, 28, 0.2);
  }

  .swatch-number {
    font-weight: 700;
    color: var(--ink);
  }

  .swatch-label {
    color: var(--ink-muted);
  }

  .small {
    font-size: 0.78rem;
  }

  .small .swatch-chip {
    width: 0.78rem;
    height: 0.78rem;
  }
</style>
