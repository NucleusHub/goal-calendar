<script setup>
import { ref, watch } from 'vue'
import TemplateModal from '@core/TemplateModal.vue'
import PencilSquareIcon from '@/assets/icons/pencil-square.svg?component'

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

function handleSubmit() {
  if (!form.value.name.trim()) return
  emit('submit', { name: form.value.name.trim(), description: form.value.description, color: form.value.color })
  emit('close')
}
</script>

<template>
  <TemplateModal :show="show" header title="Edit Goal" size="sm" body-class="px-5 pb-5 pt-2" @cancel="emit('close')">
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
                    <PencilSquareIcon v-if="COLORS.includes(form.color)" class="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input type="color" :value="form.color" @input="form.color = $event.target.value" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </label>
                </div>
              </div>

              <button type="submit" class="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg py-2 text-sm transition-colors mt-1">
                Save changes
              </button>
            </form>
  </TemplateModal>
</template>
