<script setup>
import { ref, watch } from 'vue'
import TemplateModal from '@core/TemplateModal.vue'

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

</script>

<template>
  <TemplateModal :show="show" header title="Delete Goal" size="sm" body-class="px-5 pb-5 pt-2" @cancel="emit('close')">
    <div class="flex flex-col gap-4">
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

            <template v-else>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                How do you want to delete <span class="font-medium text-slate-900 dark:text-white">{{ goal?.name }}</span>?
              </p>

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
  </TemplateModal>
</template>
