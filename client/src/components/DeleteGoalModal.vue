<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  goal: { type: Object, default: null },
  date: { type: Date, default: null },
})
const emit = defineEmits(['close', 'deleteAll', 'deleteFrom'])

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const fromDate = ref(todayStr())

watch(() => props.show, (val) => {
  if (val && props.date) {
    fromDate.value = `${props.date.getFullYear()}-${String(props.date.getMonth() + 1).padStart(2, '0')}-${String(props.date.getDate()).padStart(2, '0')}`
  }
})

function onKeydown(e) { if (e.key === 'Escape') emit('close') }
watch(() => props.show, (val) => {
  val ? window.addEventListener('keydown', onKeydown) : window.removeEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />
        <div class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
          <div class="p-5 flex flex-col gap-4">

            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Delete Goal</h2>
              <button
                @click="emit('close')"
                class="cursor-pointer p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Once: simple confirmation -->
            <template v-if="goal?.repeat === 'none'">
              <p class="text-sm text-slate-500 dark:text-slate-400">
                Remove <span class="font-medium text-slate-900 dark:text-white">{{ goal?.name }}</span>? This cannot be undone.
              </p>
              <div class="flex gap-2 justify-end">
                <button
                  @click="emit('close')"
                  class="cursor-pointer px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  @click="emit('deleteAll'); emit('close')"
                  class="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </template>

            <!-- Repeating: full options -->
            <template v-else>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                How do you want to delete <span class="font-medium text-slate-900 dark:text-white">{{ goal?.name }}</span>?
              </p>

              <!-- Delete from date -->
              <div class="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <p class="text-sm font-medium text-slate-900 dark:text-white">Delete from date</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">Removes all occurrences from this date onwards.</p>
                <input
                  v-model="fromDate"
                  type="date"
                  class="bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  @click="emit('deleteFrom', fromDate); emit('close')"
                  class="cursor-pointer w-full bg-amber-500 hover:bg-amber-400 text-white font-medium rounded-lg py-2 text-sm transition-colors"
                >
                  Delete from {{ fromDate }}
                </button>
              </div>

              <!-- Delete all -->
              <div class="flex flex-col gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p class="text-sm font-medium text-red-700 dark:text-red-400">Delete all occurrences</p>
                <p class="text-xs text-red-500 dark:text-red-500">Permanently removes this goal and all its history.</p>
                <button
                  @click="emit('deleteAll'); emit('close')"
                  class="cursor-pointer w-full bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg py-2 text-sm transition-colors"
                >
                  Delete all
                </button>
              </div>
            </template>

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
