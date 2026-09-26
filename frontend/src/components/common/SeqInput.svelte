<script lang="ts">
  import { validateColorSequence } from '../../utils/seq'

  interface Props {
    value?: number
    existing?: number[]
    label?: string
    testid?: string
  }

  let { value = $bindable(1), existing = [], label = '套色序号', testid = 'field-colorNo' }: Props = $props()

  const check = $derived(validateColorSequence([...existing, value]))
  const message = $derived(
    check.valid
      ? '序号连续，可用于当前版片'
      : `${check.duplicates.length ? `重号：${check.duplicates.join('、')}` : ''}${check.duplicates.length && check.gaps.length ? '；' : ''}${check.gaps.length ? `跳号：缺 ${check.gaps.join('、')}` : ''}`,
  )
</script>

<div class="seq-input">
  <label>
    <span>{label}</span>
    <input data-testid={testid} type="number" min="1" max="12" bind:value />
  </label>
  <p class:invalid={!check.valid}>{message}</p>
</div>

<style>
  .seq-input {
    display: grid;
    gap: 0.35rem;
  }

  label {
    display: grid;
    gap: 0.35rem;
    color: var(--ink-muted);
    font-size: 0.78rem;
    font-weight: 700;
  }

  input {
    width: 6rem;
    min-height: 2.35rem;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius-sm);
    background: #fffdf8;
    color: var(--ink);
    padding: 0.3rem 0.55rem;
    font: inherit;
  }

  p {
    margin: 0;
    color: var(--jade);
    font-size: 0.72rem;
  }

  p.invalid {
    color: var(--cinnabar);
  }
</style>
