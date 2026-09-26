<script setup>
import { ref, computed, watch } from 'vue'
import WatchlistPickerModal from './WatchlistPickerModal.vue'
import TemplateModal from '@core/TemplateModal.vue'
import { useRegistry } from '@core/useRegistry.js'
import { Icon } from '@core/icons'
import ArchiveBoxIcon from '@/assets/icons/archive-box.svg?component'
import PencilSquareIcon from '@/assets/icons/pencil-square.svg?component'

const { hasApp } = useRegistry()
const watchlistInstalled = computed(() => hasApp('watchlist'))

const props = defineProps({
  show: { type: Boolean, default: false },
  date: { type: Date, default: null },
})
const emit = defineEmits(['close', 'submit'])

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#64748b',
]

const TOP_OPTIONS = [
  { value: 'none',   label: 'Once' },
  { value: 'day',    label: 'Day' },
  { value: 'week',   label: 'Week' },
  { value: 'month',  label: 'Month' },
  { value: 'year',   label: 'Year' },
  { value: 'custom', label: 'Custom' },
]

const DAY_OPTIONS = [
  { value: 'weekday',  label: 'Week days' },
  { value: 'weekend',  label: 'Weekends' },
  { value: 'everyday', label: 'Every day' },
]

const CUSTOM_UNITS = [
  { value: 'days',   label: 'days' },
  { value: 'weeks',  label: 'weeks' },
  { value: 'months', label: 'months' },
  { value: 'years',  label: 'years' },
]

const DAY_VALUES = ['weekday', 'weekend', 'everyday']

const EMPTY = () => ({
  name: '',
  description: '',
  color: COLORS[0],
  repeat: 'none',
  customInterval: 1,
  customUnit: 'days',
  watchlistItem: null,
  countStreak: true,
})
const form = ref(EMPTY())

const showWatchlistPicker = ref(false)

const topRepeat = computed(() => DAY_VALUES.includes(form.value.repeat) ? 'day' : form.value.repeat)

function selectTop(val) {
  if (val === 'day') form.value.repeat = 'weekday'
  else form.value.repeat = val
  if (val === 'none') form.value.countStreak = false
  else if (!form.value.countStreak) form.value.countStreak = true
}

watch(() => props.show, (val) => {
  if (val) form.value = EMPTY()
})

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function onWatchlistSelect(item) {
  form.value.watchlistItem = item
}

function handleSubmit() {
  if (!form.value.name.trim()) return
  emit('submit', {
    ...form.value,
    startDate: formatDate(props.date ?? new Date()),
    watchlistItemId:     form.value.watchlistItem?._id ?? null,
    watchlistItemTitle:  form.value.watchlistItem?.title ?? null,
    watchlistItemPoster: form.value.watchlistItem?.posterUrl ?? null,
  })
  emit('close')
}
</script>

<template>
  <TemplateModal :show="show" header title="New Goal" size="sm" body-class="px-5 pb-5 pt-2" @cancel="emit('close')">
            <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
              <div class="flex flex-col gap-4">

                <button
                  v-if="watchlistInstalled"
                  type="button"
                  @click="showWatchlistPicker = true"
                  :class="[
                    'cursor-pointer flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium border transition-colors',
                    form.watchlistItem
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500/40'
                      : 'text-slate-500 dark:text-slate-400 border-black/10 dark:border-white/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-white/5'
                  ]"
                >
                  <ArchiveBoxIcon class="w-4 h-4" />
                  Import from Watchlist
                </button>

                <div class="flex flex-col gap-1.5">
                  <label class="text-sm text-slate-500 dark:text-slate-400">Name</label>
                  <input
                    v-model="form.name"
                    type="text"
                    required
                    placeholder="Goal name…"
                    autofocus
                    class="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-sm text-slate-500 dark:text-slate-400">Description</label>
                  <textarea
                    v-model="form.description"
                    rows="3"
                    placeholder="What's this goal about…"
                    class="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div class="flex flex-col gap-1.5">
                  <label class="text-sm text-slate-500 dark:text-slate-400">Repeat</label>

                  <div class="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                    <button
                      v-for="opt in TOP_OPTIONS"
                      :key="opt.value"
                      type="button"
                      @click="selectTop(opt.value)"
                      :class="[
                        'cursor-pointer flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                        topRepeat === opt.value
                          ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      ]"
                    >
                      {{ opt.label }}
                    </button>
                  </div>

                  <Transition name="expand">
                    <div v-if="topRepeat === 'day'" class="flex gap-1 px-1">
                      <button
                        v-for="opt in DAY_OPTIONS"
                        :key="opt.value"
                        type="button"
                        @click="form.repeat = opt.value"
                        :class="[
                          'cursor-pointer flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          form.repeat === opt.value
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        ]"
                      >
                        {{ opt.label }}
                      </button>
                    </div>
                  </Transition>

                  <Transition name="expand">
                    <div v-if="topRepeat === 'custom'" class="flex items-center gap-2 px-1">
                      <span class="text-sm text-slate-500 dark:text-slate-400 shrink-0">Every</span>
                      <input
                        v-model.number="form.customInterval"
                        type="number"
                        min="1"
                        class="w-16 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div class="flex gap-1 flex-1">
                        <button
                          v-for="unit in CUSTOM_UNITS"
                          :key="unit.value"
                          type="button"
                          @click="form.customUnit = unit.value"
                          :class="[
                            'cursor-pointer flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                            form.customUnit === unit.value
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          ]"
                        >
                          {{ unit.label }}
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>

                <div class="flex items-center justify-between">
                  <span
                    class="text-sm"
                    :class="form.repeat === 'none' ? 'text-slate-400 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'"
                  >Track streak</span>
                  <button
                    type="button"
                    :disabled="form.repeat === 'none'"
                    @click="form.countStreak = !form.countStreak"
                    :class="[
                      'relative w-9 h-5 rounded-full transition-colors shrink-0',
                      form.repeat === 'none'
                        ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed opacity-50'
                        : form.countStreak
                          ? 'bg-indigo-600 cursor-pointer'
                          : 'bg-slate-200 dark:bg-slate-700 cursor-pointer'
                    ]"
                  >
                    <span
                      :class="[
                        'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                        form.countStreak && form.repeat !== 'none' ? 'translate-x-4' : 'translate-x-0'
                      ]"
                    />
                  </button>
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
                      :class="[
                        'cursor-pointer w-7 h-7 rounded-full transition-transform shrink-0',
                        form.color === color ? 'outline outline-2 outline-offset-2 scale-110' : 'hover:scale-110'
                      ]"
                    />
                    <label
                      class="cursor-pointer w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:scale-110 transition-transform shrink-0 relative overflow-hidden"
                      :style="!COLORS.includes(form.color) ? { backgroundColor: form.color, outlineColor: form.color, outline: '2px solid', outlineOffset: '2px' } : {}"
                      title="Custom color"
                    >
                      <PencilSquareIcon v-if="COLORS.includes(form.color)" class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      <input
                        type="color"
                        :value="form.color"
                        @input="form.color = $event.target.value"
                        class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>
                  </div>
                </div>

                <Transition name="expand">
                  <div
                    v-if="form.watchlistItem"
                    class="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2 flex items-center gap-2.5 border border-slate-200 dark:border-slate-700"
                  >
                    <div class="w-10 shrink-0 aspect-[2/3] rounded overflow-hidden bg-slate-200 dark:bg-slate-600">
                      <img
                        v-if="form.watchlistItem.posterUrl"
                        :src="form.watchlistItem.posterUrl"
                        :alt="form.watchlistItem.title"
                        class="w-full h-full object-cover"
                      />
                      <div v-else class="w-full h-full bg-slate-300 dark:bg-slate-600" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-slate-900 dark:text-white truncate">{{ form.watchlistItem.title }}</p>
                    </div>
                    <button
                      type="button"
                      @click="form.watchlistItem = null"
                      class="cursor-pointer shrink-0 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      title="Remove link"
                    >
                      <Icon name="close" class="w-3.5 h-3.5" :sw="2.5" />
                    </button>
                  </div>
                </Transition>

                <button
                  type="submit"
                  class="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg py-2 text-sm transition-colors mt-1"
                >
                  Create goal
                </button>

              </div>
            </form>
  </TemplateModal>

  <WatchlistPickerModal
    :show="showWatchlistPicker"
    @close="showWatchlistPicker = false"
    @select="onWatchlistSelect"
  />
</template>

<style scoped>
.expand-enter-active, .expand-leave-active {
  transition: opacity 0.18s ease, max-height 0.2s ease;
  max-height: 60px;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
