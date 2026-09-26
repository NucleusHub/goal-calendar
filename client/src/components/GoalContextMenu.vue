<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import { Icon } from '@core/icons'
import TrashIcon from '@/assets/icons/trash.svg?component'

const props = defineProps({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
})
const emit = defineEmits(['edit', 'delete', 'close'])

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

// pointerdown, not click: the long-press finger-lift fires a synthetic click.
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
        <Icon name="edit" class="w-4 h-4 text-slate-400" />
        Edit
      </button>
      <button
        @click="emit('delete'); emit('close')"
        class="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <TrashIcon class="w-4 h-4" />
        Delete
      </button>
    </div>
  </Teleport>
</template>
