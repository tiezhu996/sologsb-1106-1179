<script lang="ts">
  interface Props {
    title: string
    message: string
    actionLabel?: string
    onaction?: () => void
  }

  let { title, message, actionLabel, onaction }: Props = $props()
</script>

<div class="empty-box">
  <div class="empty-mark" aria-hidden="true">
    <svg viewBox="0 0 64 64" role="img">
      <path d="M13 15h38v34H13z" fill="none" stroke="currentColor" stroke-width="2.4" />
      <path d="M11 15h42M18 10v10M46 10v10M22 25h20M22 33h14M22 41h18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
      <path d="m38 43 4 4 8-10" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </div>
  <h3>{title}</h3>
  <p>{message}</p>
  {#if actionLabel && onaction}
    <button type="button" class="button primary" onclick={onaction}>{actionLabel}</button>
  {/if}
</div>

<style>
  .empty-box {
    min-height: 15rem;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 0.75rem;
    text-align: center;
    padding: 2.5rem;
    border: 1px dashed var(--line-strong);
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--paper) 88%, transparent);
  }

  .empty-mark {
    width: 4rem;
    color: var(--cinnabar);
    opacity: 0.72;
  }

  h3 {
    margin: 0;
    color: var(--ink);
    font-size: 1.12rem;
  }

  p {
    max-width: 28rem;
    margin: 0;
    color: var(--ink-muted);
    line-height: 1.7;
  }
</style>
