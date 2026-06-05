<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  goal: { type: Object, default: null },
})
const emit = defineEmits(['close', 'submit'])

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#64748b',
]

const form = ref({ name: '', description: '', color: COLORS[0] })

watch(() => props.show, (val) => {
  if (val && props.goal) {
    form.value = { name: props.goal.name, description: props.goal.description || '', color: props.goal.color }
  }
})

function onKeydown(e) { if (e.key === 'Escape') emit('close') }
watch(() => props.show, (val) => {
  val ? window.addEventListener('keydown', onKeydown) : window.removeEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

function handleSubmit() {
  if (!form.value.name.trim()) return
  emit('submit', { name: form.value.name.trim(), description: form.value.description, color: form.value.color })
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/20 backdrop-blur-xl" @click="emit('close')" />
        <div class="relative bg-white/25 dark:bg-white/8 border border-white/50 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md">
          <div class="p-5 flex flex-col gap-5">

            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Edit Goal</h2>
              <button
                @click="emit('close')"
                class="cursor-pointer p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">

              <div class="flex flex-col gap-1.5">
                <label class="text-sm text-slate-500 dark:text-slate-400">Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  autofocus
                  class="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  class="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-sm text-slate-500 dark:text-slate-400">Color</label>
                <div class="flex gap-2 flex-wrap items-center">
                  <button
                    v-for="color in COLORS"
                    :key="color"
                    type="button"
                    @click="form.color = color"
                    :style="{ backgroundColor: color, outlineColor: color }"
                    :class="['cursor-pointer w-7 h-7 rounded-full transition-transform shrink-0', form.color === color ? 'outline outline-2 outline-offset-2 scale-110' : 'hover:scale-110']"
                  />
                  <label
                    class="cursor-pointer w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:scale-110 transition-transform shrink-0 relative overflow-hidden"
                    :style="!COLORS.includes(form.color) ? { backgroundColor: form.color, outlineColor: form.color, outline: '2px solid', outlineOffset: '2px' } : {}"
                  >
                    <svg v-if="COLORS.includes(form.color)" class="w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
                    </svg>
                    <input type="color" :value="form.color" @input="form.color = $event.target.value" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </label>
                </div>
              </div>

              <button type="submit" class="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg py-2 text-sm transition-colors mt-1">
                Save changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
