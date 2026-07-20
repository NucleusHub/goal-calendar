<script setup>
import { ref, computed, watch } from 'vue'
import TemplateModal from '@core/TemplateModal.vue'
import { Icon, Spinner } from '@core/icons'
import ArchiveBoxIcon from '@/assets/icons/archive-box.svg?component'

const props = defineProps({
  show: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'select'])

const items = ref([])
const loading = ref(false)
const filter = ref('all')
const search = ref('')

const FILTERS = [
  { value: 'all',   label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'show',  label: 'Shows' },
]

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return items.value.filter(item => {
    if (item.status === 'completed') return false
    if (filter.value !== 'all' && item.type !== filter.value) return false
    if (q && !item.title.toLowerCase().includes(q)) return false
    return true
  })
})

watch(() => props.show, async (val) => {
  if (val) {
    filter.value = 'all'
    search.value = ''
    loading.value = true
    try {
      const res = await fetch('/api/watchlist')
      items.value = await res.json()
    } finally {
      loading.value = false
    }
  }
})

function selectItem(item) {
  emit('select', {
    _id: item._id,
    title: item.title,
    posterUrl: item.posterUrl ?? item.poster ?? null,
  })
  emit('close')
}

function typeBadge(type) {
  if (type === 'movie') return 'Movie'
  if (type === 'show') return 'Show'
  return type ?? ''
}

function formatRuntime(item) {
  if (item.type === 'movie') {
    if (!item.runtime) return null
    const h = Math.floor(item.runtime / 60)
    const m = item.runtime % 60
    return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`
  }
  const parts = []
  if (item.seasons) parts.push(`${item.seasons} season${item.seasons !== 1 ? 's' : ''}`)
  if (item.episodes) parts.push(`${item.episodes} ep`)
  return parts.join(' · ') || null
}
</script>

<template>
  <TemplateModal
    :show="show"
    header
    searchable
    v-model:search="search"
    title="Import from Watchlist"
    size="xl"
    z="z-[300]"
    body-class="px-5 pb-5 pt-1"
    @cancel="emit('close')"
  >
          <!-- Filter tabs -->
          <div class="flex gap-1 pb-3 sticky top-0">
            <button
              v-for="tab in FILTERS"
              :key="tab.value"
              type="button"
              @click="filter = tab.value"
              :class="[
                'cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filter === tab.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              ]"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Body -->
          <div>

            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-16">
              <Spinner class="w-8 h-8 text-indigo-500 animate-spin" />
            </div>

            <!-- Empty -->
            <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center py-16 gap-2 text-slate-400 dark:text-slate-500">
              <ArchiveBoxIcon class="w-10 h-10" />
              <span class="text-sm">No items found</span>
            </div>

            <!-- Grid -->
            <div v-else class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              <button
                v-for="item in filtered"
                :key="item._id"
                type="button"
                @click="selectItem(item)"
                :class="[
                  'cursor-pointer text-left rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700/60 hover:ring-2 hover:ring-indigo-500 transition-all group'
                ]"
              >
                <!-- Poster -->
                <div class="aspect-[2/3] w-full overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-700">
                  <img
                    v-if="item.posterUrl || item.poster"
                    :src="item.posterUrl ?? item.poster"
                    :alt="item.title"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                    <Icon name="calendar" class="w-8 h-8" :sw="1.5" />
                  </div>
                </div>
                <!-- Info -->
                <div class="p-2 flex flex-col gap-1">
                  <p class="text-xs font-medium text-slate-900 dark:text-white leading-tight line-clamp-2">{{ item.title }}</p>
                  <div class="flex items-center gap-1 flex-wrap">
                    <span class="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300 uppercase tracking-wide">
                      {{ typeBadge(item.type) }}
                    </span>
                    <span v-if="formatRuntime(item)" class="text-[10px] text-slate-400 dark:text-slate-500">
                      {{ formatRuntime(item) }}
                    </span>
                  </div>
                </div>
              </button>
            </div>

          </div>
  </TemplateModal>
</template>
