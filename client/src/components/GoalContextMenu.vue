<script setup>
import { onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
})
const emit = defineEmits(['edit', 'delete', 'close'])

// Keep the menu on-screen — important on phones where a long-press near an edge
// would otherwise push it out of view. Sizes are the menu's approx footprint.
const MENU_W = 160
const MENU_H = 104
const pos = computed(() => {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768
  return {
    left: `${Math.max(8, Math.min(props.x, vw - MENU_W - 8))}px`,
    top: `${Math.max(8, Math.min(props.y, vh - MENU_H - 8))}px`,
  }
})

function onKey(e) { if (e.key === 'Escape') emit('close') }
function onOutside() { emit('close') }

// Listen on pointerdown (not click): a long-press opens this menu, and the
// finger-lift then fires a synthetic `click` that would instantly close a
// click-based listener. pointerdown fires only on a *new* press, so the menu
// survives the opening gesture and still closes on the next tap anywhere.
onMounted(() => {
  window.addEventListener('keydown', onKey)
  setTimeout(() => window.addEventListener('pointerdown', onOutside), 0)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('pointerdown', onOutside)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed z-[60] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-xl shadow-2xl border border-white/60 dark:border-white/10 py-1 min-w-40"
      :style="pos"
      @click.stop
      @pointerdown.stop
    >
      <button
        @click="emit('edit'); emit('close')"
        class="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>
      <button
        @click="emit('delete'); emit('close')"
        class="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>
    </div>
  </Teleport>
</template>
