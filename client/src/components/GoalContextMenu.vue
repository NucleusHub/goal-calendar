<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
})
const emit = defineEmits(['edit', 'delete', 'close'])

function onKey(e) { if (e.key === 'Escape') emit('close') }
function onClickOutside() { emit('close') }

onMounted(() => {
  window.addEventListener('keydown', onKey)
  setTimeout(() => window.addEventListener('click', onClickOutside), 0)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('click', onClickOutside)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed z-[60] bg-white/25 dark:bg-white/8 rounded-xl shadow-2xl border border-white/60 dark:border-white/10 py-1 min-w-36"
      :style="{ top: `${y}px`, left: `${x}px` }"
      @click.stop
    >
      <button
        @click="emit('edit'); emit('close')"
        class="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>
      <button
        @click="emit('delete'); emit('close')"
        class="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>
    </div>
  </Teleport>
</template>
