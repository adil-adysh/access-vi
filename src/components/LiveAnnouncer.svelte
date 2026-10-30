<script lang="ts">
  interface Props {
    politeText?: string;
    assertiveText?: string;
  }

  let { politeText = '', assertiveText = '' }: Props = $props();
</script>

<div class="sr-only" aria-live="polite" aria-atomic="true">
  {politeText}
</div>

<div class="sr-only" aria-live="assertive" aria-atomic="true">
  {assertiveText}
</div>
