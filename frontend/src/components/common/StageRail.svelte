<script lang="ts">
  import type { ProcessStage } from '../../types/node'

  interface Props {
    stages?: ProcessStage[]
    activeIndex?: number
    completedCount?: number
    onselect?: (index: number, stage: ProcessStage) => void
    compact?: boolean
  }

  const defaultStages: ProcessStage[] = ['起稿', '勾描', '上样', '刻版', '修版', '调色', '套印', '晾晒']

  let {
    stages = defaultStages,
    activeIndex = 0,
    completedCount = 0,
    onselect,
    compact = false,
  }: Props = $props()
</script>

<div class:compact class="stage-rail" aria-label="工序阶段">
  {#each stages as stage, index}
    {@const done = index < completedCount}
    {@const active = index === activeIndex}
    <button
      type="button"
      class:done
      class:active
      disabled={!onselect}
      onclick={() => onselect?.(index, stage)}
      title={onselect ? `回到${stage}阶段` : stage}
    >
      <span class="stage-dot">{done ? '✓' : index + 1}</span>
      <span class="stage-name">{stage}</span>
    </button>
  {/each}
</div>

<style>
  .stage-rail {
    display: grid;
    grid-template-columns: repeat(8, minmax(3.8rem, 1fr));
    gap: 0;
    overflow-x: auto;
    padding: 0.25rem 0;
  }

  button {
    position: relative;
    min-width: 3.8rem;
    display: grid;
    justify-items: center;
    gap: 0.38rem;
    border: 0;
    background: transparent;
    color: var(--ink-muted);
    padding: 0 0.2rem;
    cursor: default;
  }

  button:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 0.82rem;
    left: calc(50% + 0.75rem);
    right: calc(-50% + 0.75rem);
    height: 2px;
    background: var(--line);
  }

  button:not(:disabled) {
    cursor: pointer;
  }

  button:not(:disabled):hover .stage-dot {
    transform: translateY(-2px);
    box-shadow: 0 5px 14px rgba(81, 48, 23, 0.18);
  }

  .stage-dot {
    position: relative;
    z-index: 1;
    width: 1.65rem;
    height: 1.65rem;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 2px solid var(--line-strong);
    background: var(--paper);
    color: var(--ink-muted);
    font-size: 0.74rem;
    font-weight: 800;
    transition: 150ms ease;
  }

  .stage-name {
    font-size: 0.74rem;
    font-weight: 650;
    white-space: nowrap;
  }

  .done .stage-dot {
    border-color: var(--jade);
    background: var(--jade);
    color: #fff;
  }

  .done:not(:last-child)::after {
    background: var(--jade);
  }

  .active .stage-dot {
    border-color: var(--cinnabar);
    background: #fff6ef;
    color: var(--cinnabar);
    box-shadow: 0 0 0 4px rgba(174, 52, 39, 0.12);
  }

  .active .stage-name {
    color: var(--cinnabar);
  }

  .compact {
    grid-template-columns: repeat(4, minmax(3.5rem, 1fr));
    row-gap: 0.8rem;
  }
</style>
