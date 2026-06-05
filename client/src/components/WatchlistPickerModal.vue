<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

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

function onKeydown(e) {
  if (e.key === 'Escape') emit('close')
}
watch(() => props.show, (val) => {
  val ? window.addEventListener('keydown', onKeydown) : window.removeEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

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
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/20 backdrop-blur-xl" @click="emit('close')" />
        <div class="relative bg-white/25 dark:bg-white/8 border border-white/50 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style="max-height: 80vh;">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Import from Watchlist</h2>
            <button
              @click="emit('close')"
              class="cursor-pointer p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Search -->
          <div class="px-5 pb-3 shrink-0">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                v-model="search"
                type="text"
                placeholder="Search…"
                class="w-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <!-- Filter tabs -->
          <div class="flex gap-1 px-5 pb-3 shrink-0">
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
          <div class="flex-1 overflow-y-auto px-5 pb-5 min-h-0">

            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-16">
              <svg class="w-8 h-8 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>

            <!-- Empty -->
            <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center py-16 gap-2 text-slate-400 dark:text-slate-500">
              <svg class="w-10 h-10" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125-.375-12a1.125 1.125 0 011.125-1.125h15.75A1.125 1.125 0 0120.625 6.5l-.375 12M6 18.375V7.875C6 7.254 6.504 6.75 7.125 6.75h9.75C17.496 6.75 18 7.254 18 7.875v10.5m0 0c0 .621-.504 1.125-1.125 1.125H7.125" />
              </svg>
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
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
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
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
