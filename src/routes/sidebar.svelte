<script lang="ts">
  export let onClose: (() => unknown) | undefined = undefined
  export let togglePin: () => unknown
</script>

<section id="sidebar" class="flex flex-col w-80 h-full bg-base-100">
  <div class="navbar bg-base-200">
    <div class="navbar-start">mapping.place</div>
    <div class="navbar-end">
      <button
        class="btn btn-ghost h-8 aspect-square p-1 font-mono font-bold"
        on:click={togglePin}
      >
        📌
      </button>
      {#if onClose}
        <button
          class="btn btn-ghost h-8 aspect-square p-1 font-mono font-bold"
          on:click={onClose}
        >
          ❌
        </button>
      {/if}
    </div>
  </div>
  <div class="flex-1 p-2">
    <slot />
  </div>
</section>
