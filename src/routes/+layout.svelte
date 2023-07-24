<script lang="ts">
  import '$lib/styles/global.css'
  import '$lib/utils/dayjs'
  import Sidebar from './sidebar.svelte'

  let dark = true
  let drawerPinned = false
  let drawerCheckbox: HTMLInputElement

  function handleCloseDrawer() {
    drawerCheckbox.checked = false
  }

  function handleToggleDrawerPin() {
    drawerPinned = !drawerPinned
    handleCloseDrawer()
  }
</script>

<main
  class="fullscreen flex flex-col min-w-[320px] {dark ? 'dark' : 'light'}"
  data-theme={dark ? 'dark' : 'light'}
>
  <div class="drawer h-full">
    <input
      bind:this={drawerCheckbox}
      id="drawer"
      type="checkbox"
      class="drawer-toggle"
    />
    <div class="drawer-content flex flex-col">
      <section id="header" class="w-full">
        <div class="navbar bg-base-200">
          <div class="navbar-start">
            {#if !drawerPinned}
              <label
                for="drawer"
                class="btn btn-ghost p-1 aspect-square sm:aspect-auto drawer-button text-xl font-bold"
              >
                <div class="flex flex-nowrap items-center gap-1">
                  <img
                    class="h-8 aspect-square"
                    src="/favicon.png"
                    alt="mapping.place logo"
                  />
                  <span class="hidden sm:inline">mapping.place</span>
                </div>
              </label>
            {/if}
          </div>
          <div class="navbar-end">
            <label class="btn btn-circle btn-ghost swap swap-rotate">
              <input id="theme" type="checkbox" bind:checked={dark} />
              <p class="swap-on">🌙</p>
              <p class="swap-off">🌞</p>
            </label>
          </div>
        </div>
      </section>
      <section id="content" class="flex-1">
        <slot />
      </section>
      <!-- <section id="footer" class="w-full">
        <div class="bg-base-200">
          <div class="flex items-center justify-center p-2">[FOOTER]</div>
        </div>
      </section> -->
    </div>

    <div class:drawer-side={!drawerPinned}>
      <label for="drawer" class="drawer-overlay" />
      <Sidebar
        onClose={drawerPinned ? undefined : handleCloseDrawer}
        togglePin={handleToggleDrawerPin}
      >
        <div class="flex flex-col items-center justify-center h-full">
          [SIDEBAR]
        </div>
      </Sidebar>
    </div>
  </div>
</main>

<style>
  .fullscreen {
    height: 100dvh;
    width: 100dvw;
  }
</style>
