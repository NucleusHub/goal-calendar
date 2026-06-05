<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { animate } from 'animejs'
import confetti from 'canvas-confetti'
import AppSidebar from '@/components/AppSidebar.vue'
import GoalModal from '@/components/GoalModal.vue'
import GoalContextMenu from '@/components/GoalContextMenu.vue'
import EditGoalModal from '@/components/EditGoalModal.vue'
import DeleteGoalModal from '@/components/DeleteGoalModal.vue'
import { getGoals, createGoal, updateGoal, deleteGoal, toggleGoalDate } from '@/api/goals.js'

const sidebarOpen = ref(false)

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const direction = ref('next')

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const monthLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value).toLocaleString('default', { month: 'long', year: 'numeric' })
)

function prevMonth() {
  direction.value = 'prev'
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}

function nextMonth() {
  direction.value = 'next'
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}

function goToday() {
  const ty = today.getFullYear()
  const tm = today.getMonth()
  const cur = currentYear.value * 12 + currentMonth.value
  const target = ty * 12 + tm
  direction.value = target >= cur ? 'next' : 'prev'
  currentYear.value = ty
  currentMonth.value = tm
}

const calendarDays = computed(() => {
  const first = new Date(currentYear.value, currentMonth.value, 1)
  const last = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startPad = (first.getDay() + 6) % 7
  const days = []

  for (let i = startPad - 1; i >= 0; i--) {
    days.push({ date: new Date(currentYear.value, currentMonth.value, -i), inMonth: false })
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push({ date: new Date(currentYear.value, currentMonth.value, d), inMonth: true })
  }
  while (days.length < 42) {
    days.push({ date: new Date(currentYear.value, currentMonth.value + 1, days.length - startPad - last.getDate() + 1), inMonth: false })
  }

  return days
})

function isToday(date) {
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

const calendarKey = computed(() => `${currentYear.value}-${currentMonth.value}`)

// ── Goals ──────────────────────────────────────────────────────────────────
const goals = ref([])

onMounted(async () => {
  goals.value = await getGoals()
})

async function addGoal(goal) {
  const created = await createGoal(goal)
  goals.value.push(created)
}

const MS_DAY = 86_400_000

function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function appearsOnDay(goal, date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const start = parseLocalDate(goal.startDate)

  if (d < start) return false
  if (goal.deletedFrom && d >= parseLocalDate(goal.deletedFrom)) return false

  switch (goal.repeat) {
    case 'none':
      return d.getTime() === start.getTime()
    case 'everyday':
      return true
    case 'weekday':
      return d.getDay() >= 1 && d.getDay() <= 5
    case 'weekend':
      return d.getDay() === 0 || d.getDay() === 6
    case 'week':
      return d.getDay() === start.getDay()
    case 'month':
      return d.getDate() === start.getDate()
    case 'year':
      return d.getMonth() === start.getMonth() && d.getDate() === start.getDate()
    case 'custom': {
      const { customInterval: n, customUnit: unit } = goal
      switch (unit) {
        case 'days':
          return (d - start) % (n * MS_DAY) === 0
        case 'weeks':
          return (d - start) % (n * 7 * MS_DAY) === 0
        case 'months': {
          const mDiff = (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth())
          return mDiff % n === 0 && d.getDate() === start.getDate()
        }
        case 'years': {
          const yDiff = d.getFullYear() - start.getFullYear()
          return yDiff % n === 0 && d.getMonth() === start.getMonth() && d.getDate() === start.getDate()
        }
      }
    }
  }
  return false
}

const goalsPerDay = computed(() => {
  const map = new Map()
  for (const day of calendarDays.value) {
    const key = dateKey(day.date)
    map.set(key, goals.value.filter(g => appearsOnDay(g, day.date)))
  }
  return map
})

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isCompletedOnDay(goal, date) {
  return goal.completedDates?.includes(dateKey(date))
}

function getStreak(goal) {
  if (goal.repeat === 'none') return 0
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const start = parseLocalDate(goal.startDate)
  let streak = 0
  let d = new Date(todayNorm)
  while (d.getTime() >= start.getTime()) {
    if (appearsOnDay(goal, d)) {
      if (goal.completedDates?.includes(dateKey(d))) {
        streak++
      } else if (d.getTime() !== todayNorm.getTime()) {
        break // missed a scheduled day
      }
    }
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
  }
  return streak
}

const streakGoals = computed(() =>
  goals.value
    .filter(g => g.repeat !== 'none' && g.countStreak !== false)
    .map(g => ({ goal: g, streak: getStreak(g) }))
    .filter(({ streak }) => streak > 0)
    .sort((a, b) => b.streak - a.streak)
)

// ── Animation toggles ──────────────────────────────────────────────────────
const ANIM_KEY = 'nucleus-goals-anim'
const anim = ref(JSON.parse(localStorage.getItem(ANIM_KEY) ?? 'null') ?? { confetti: true, flames: true, ring: true })
watch(anim, v => localStorage.setItem(ANIM_KEY, JSON.stringify(v)), { deep: true })
const animAll = computed(() => anim.value.confetti && anim.value.flames && anim.value.ring)
function toggleAll() {
  const next = !animAll.value
  anim.value = { confetti: next, flames: next, ring: next }
}

// ── Fire border (streak milestones) ────────────────────────────────────────
const fieryGoalIds = ref([])

async function activateFireBorder(goalId) {
  if (fieryGoalIds.value.includes(goalId)) return
  fieryGoalIds.value = [...fieryGoalIds.value, goalId]
  await nextTick()

  const wrapper = document.querySelector(`[data-fid="${goalId}"]`)
  const svgEl = wrapper?.querySelector('.fire-svg')
  const rectEl = wrapper?.querySelector('.fire-arc')
  if (!wrapper || !svgEl || !rectEl) return

  const { width, height } = wrapper.getBoundingClientRect()
  svgEl.setAttribute('width', width)
  svgEl.setAttribute('height', height)
  rectEl.setAttribute('width', width - 3)
  rectEl.setAttribute('height', height - 3)

  const rx = 10
  const perimeter = 2 * ((width - 3) + (height - 3)) - 8 * rx + 2 * Math.PI * rx
  const dashLen = perimeter * 0.22

  rectEl.style.strokeDasharray = `${dashLen} ${perimeter}`
  rectEl.style.strokeDashoffset = '0'

  animate(rectEl, {
    strokeDashoffset: -(perimeter + dashLen),
    duration: 650,
    ease: 'linear',
    onComplete() {
      fieryGoalIds.value = fieryGoalIds.value.filter(id => id !== goalId)
    },
  })
}

// ── Fire particle animation ─────────────────────────────────────────────────
const fires = ref([])
let fireId = 0

function triggerFireAnimation(e) {
  const particles = Array.from({ length: 7 }, () => ({
    id: fireId++,
    x: e.clientX + (Math.random() - 0.5) * 60,
    y: e.clientY + (Math.random() - 0.5) * 10,
    size: 14 + Math.random() * 12,
    delay: Math.random() * 200,
    drift: (Math.random() - 0.5) * 40,
  }))
  fires.value.push(...particles)
  setTimeout(() => {
    const ids = new Set(particles.map(p => p.id))
    fires.value = fires.value.filter(f => !ids.has(f.id))
  }, 1400)
}

function isFuture(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return d > t
}

async function toggleCompletion(goal, date, e) {
  if (isFuture(date)) return
  const key = dateKey(date)
  const wasCompleted = isCompletedOnDay(goal, date)
  const streakBefore = getStreak(goal)
  const updated = await toggleGoalDate(goal._id, key)
  const idx = goals.value.findIndex(g => g._id === goal._id)
  if (idx !== -1) goals.value[idx] = updated
  if (!wasCompleted) {
    if (anim.value.confetti) fireConfetti(e)
    const streakAfter = getStreak(goals.value[idx])
    if (anim.value.flames && streakAfter > streakBefore) triggerFireAnimation(e)
    if (anim.value.ring && (streakAfter === 1 || (streakAfter > 0 && streakAfter % 7 === 0))) activateFireBorder(goal._id)
    if (goal.watchlistItemId) {
      await fetch(`/api/watchlist/${goal.watchlistItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
    }
  }
}

function fireConfetti(e) {
  const x = e.clientX / window.innerWidth
  const y = e.clientY / window.innerHeight
  const colors = ['#6366f1', '#a78bfa', '#34d399', '#fbbf24', '#f472b6']
  confetti({ particleCount: 70, spread: 80, origin: { x, y }, colors, scalar: 0.4, startVelocity: 30 })
  setTimeout(() => {
    confetti({ particleCount: 40, spread: 50, origin: { x, y: y - 0.04 }, colors, scalar: 0.3, startVelocity: 18, gravity: 0.6 })
  }, 130)
}

// ── Context menu ───────────────────────────────────────────────────────────
const ctxMenu = ref({ visible: false, x: 0, y: 0, goal: null, date: null })

function onChipRightClick(e, goal, date) {
  e.preventDefault()
  e.stopPropagation()
  ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY, goal, date }
}

// ── Edit ───────────────────────────────────────────────────────────────────
const editModal = ref({ visible: false, goal: null })

async function submitEdit(fields) {
  const updated = await updateGoal(editModal.value.goal._id, fields)
  const idx = goals.value.findIndex(g => g._id === updated._id)
  if (idx !== -1) goals.value.splice(idx, 1, updated)
}

// ── Delete ─────────────────────────────────────────────────────────────────
const deleteModal = ref({ visible: false, goal: null, date: null })

async function handleDeleteAll() {
  await deleteGoal(deleteModal.value.goal._id)
  goals.value = goals.value.filter(g => g._id !== deleteModal.value.goal._id)
}

async function handleDeleteFrom(fromDate) {
  const updated = await updateGoal(deleteModal.value.goal._id, { deletedFrom: fromDate })
  const idx = goals.value.findIndex(g => g._id === updated._id)
  if (idx !== -1) goals.value[idx] = updated
}

// ── New goal modal ─────────────────────────────────────────────────────────
const modalOpen = ref(false)
const selectedDay = ref(null)

function openModal(day) {
  selectedDay.value = day
  modalOpen.value = true
}
</script>

<template>
  <div class="relative min-h-screen bg-slate-100 dark:bg-[#0d0d1a] text-slate-900 dark:text-white flex flex-col overflow-x-hidden">
    <!-- Background blobs -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <div class="absolute -top-32 -left-32 w-[450px] h-[450px] rounded-full bg-violet-400/30 dark:bg-violet-700/45 blur-[100px]" />
      <div class="absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full bg-indigo-400/30 dark:bg-indigo-700/45 blur-[100px]" />
      <div class="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-blue-400/20 dark:bg-blue-600/30 blur-[80px]" />
    </div>

    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Header: hamburger pinned left, nav controls centered -->
    <header class="relative sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-[#0d0d1a]/80 border-b border-white/50 dark:border-white/8 flex items-center px-4 py-3 shadow-sm shadow-indigo-500/5">
      <button
        @click="sidebarOpen = true"
        class="cursor-pointer shrink-0 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/8 dark:hover:bg-white/10 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <!-- Centered nav controls -->
      <div class="absolute left-0 right-0 flex items-center justify-center gap-2 pointer-events-none">
        <div class="flex items-center gap-2 pointer-events-auto">
          <button
            @click="prevMonth"
            class="cursor-pointer p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/8 dark:hover:bg-white/10 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <h1 class="text-base font-semibold min-w-40 text-center">{{ monthLabel }}</h1>

          <button
            @click="nextMonth"
            class="cursor-pointer p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/8 dark:hover:bg-white/10 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <button
            @click="goToday"
            class="cursor-pointer ml-1 px-3 py-1 text-xs font-medium rounded-lg bg-black/8 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-black/12 dark:hover:bg-white/15 backdrop-blur-sm transition-colors"
          >
            Today
          </button>
        </div>
      </div>
    </header>

    <!-- Calendar -->
    <main class="relative z-10 flex-1 p-4 sm:p-6 w-full">
      <div class="relative max-w-4xl mx-auto">
      <!-- Day labels -->
      <div class="grid grid-cols-7 mb-1">
        <div
          v-for="day in DAYS"
          :key="day"
          class="text-center text-xs font-medium text-slate-400 dark:text-slate-500 py-2"
        >
          {{ day }}
        </div>
      </div>

      <!-- Animated day grid -->
      <div class="overflow-hidden rounded-xl relative">
        <Transition :name="direction === 'next' ? 'slide-left' : 'slide-right'">
          <div
            :key="calendarKey"
            class="grid grid-cols-7 gap-px bg-slate-200/60 dark:bg-slate-800/60 border border-white/40 dark:border-white/8"
          >
            <div
              v-for="(day, i) in calendarDays"
              :key="i"
              class="group/day bg-white/60 dark:bg-slate-900/60 min-h-24 p-2 flex flex-col gap-1 relative"
              :class="!day.inMonth ? 'opacity-40' : ''"
            >
              <div class="flex items-center justify-between">
                <span
                  :class="[
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full shrink-0',
                    isToday(day.date)
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-700 dark:text-slate-300'
                  ]"
                >
                  {{ day.date.getDate() }}
                </span>
                <button
                  @click="openModal(day)"
                  class="cursor-pointer opacity-0 group-hover/day:opacity-100 transition-opacity w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-slate-500 hover:text-white flex items-center justify-center shrink-0"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <!-- Goal chips -->
              <div class="flex flex-wrap gap-1 mt-1">
                <button
                  v-for="goal in goalsPerDay.get(dateKey(day.date)) ?? []"
                  :key="goal._id"
                  @click.stop="toggleCompletion(goal, day.date, $event)"
                  @contextmenu.stop="onChipRightClick($event, goal, day.date)"
                  :class="[
                    'relative w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all shrink-0',
                    isFuture(day.date) ? 'cursor-default opacity-40' : 'cursor-pointer group/chip',
                    isCompletedOnDay(goal, day.date) ? 'ring-2 ring-offset-1 ring-green-500' : '',
                  ]"
                  :style="{ backgroundColor: goal.color }"
                  :title="goal.name"
                >
                  <span class="group-hover/chip:opacity-0 transition-opacity select-none">
                    {{ goal.name[0].toUpperCase() }}
                  </span>
                  <svg class="absolute opacity-0 group-hover/chip:opacity-100 transition-opacity w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Streaks -->
      <Transition name="fade-up">
        <div v-if="streakGoals.length" class="mt-6 flex flex-col gap-3">
          <p class="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Active streaks</p>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="{ goal, streak } in streakGoals"
              :key="goal._id"
              :data-fid="goal._id"
              class="relative rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <svg v-if="fieryGoalIds.includes(goal._id)" class="fire-svg absolute top-0 left-0 pointer-events-none" style="overflow:visible">
                <defs>
                  <filter :id="`glow-${goal._id}`" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="2.5" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <rect class="fire-arc" x="1.5" y="1.5" rx="10" ry="10"
                  fill="none" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"
                  :filter="`url(#glow-${goal._id})`"
                />
              </svg>
              <div class="relative flex items-center gap-2 px-3 py-2 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 rounded-[10px] shadow-sm border border-white/50 dark:border-white/8">
                <div class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ backgroundColor: goal.color }" />
                <span class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ goal.name }}</span>
                <span class="text-sm font-bold text-orange-500">{{ streak }}</span>
                <span class="text-base leading-none">🔥</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
      <!-- Animation toggles panel: floats to the right of the centered calendar -->
      <div class="absolute top-[36px] left-full ml-4 w-40 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 rounded-xl border border-white/60 dark:border-white/10 p-3 flex flex-col gap-3 shadow-lg shadow-indigo-500/10 dark:shadow-black/30">
        <p class="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Animations</p>
        <div class="flex flex-col gap-2">
          <!-- All -->
          <div class="flex items-center gap-2">
            <span class="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200">✨ All</span>
            <button type="button" @click="toggleAll"
              :class="['relative w-8 h-4 rounded-full transition-colors shrink-0 cursor-pointer', animAll ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700']">
              <span :class="['absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform', animAll ? 'translate-x-4' : 'translate-x-0']" />
            </button>
          </div>
          <div class="border-t border-black/8 dark:border-white/8" />
          <!-- Individual -->
          <div v-for="item in [
            { key: 'confetti', label: 'Confetti', emoji: '🎊' },
            { key: 'flames',   label: 'Flames',   emoji: '🔥' },
            { key: 'ring',     label: 'Ring',     emoji: '💫' },
          ]" :key="item.key" class="flex items-center gap-2">
            <span class="flex-1 text-xs text-slate-500 dark:text-slate-400">{{ item.emoji }} {{ item.label }}</span>
            <button type="button" @click="anim[item.key] = !anim[item.key]"
              :class="['relative w-8 h-4 rounded-full transition-colors shrink-0 cursor-pointer', anim[item.key] ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700']">
              <span :class="['absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform', anim[item.key] ? 'translate-x-4' : 'translate-x-0']" />
            </button>
          </div>
        </div>
      </div>
      </div><!-- end mx-auto wrapper -->
    </main>

    <!-- Fire particles -->
    <span
      v-for="f in fires"
      :key="f.id"
      class="fire-particle"
      :style="{ left: f.x + 'px', top: f.y + 'px', fontSize: f.size + 'px', '--drift': f.drift + 'px', animationDelay: f.delay + 'ms' }"
    >🔥</span>

    <GoalModal
      :show="modalOpen"
      :date="selectedDay?.date"
      @close="modalOpen = false"
      @submit="addGoal"
    />

    <GoalContextMenu
      v-if="ctxMenu.visible"
      :x="ctxMenu.x"
      :y="ctxMenu.y"
      @edit="editModal = { visible: true, goal: ctxMenu.goal }"
      @delete="deleteModal = { visible: true, goal: ctxMenu.goal, date: ctxMenu.date }"
      @close="ctxMenu.visible = false"
    />

    <EditGoalModal
      :show="editModal.visible"
      :goal="editModal.goal"
      @close="editModal.visible = false"
      @submit="submitEdit"
    />

    <DeleteGoalModal
      :show="deleteModal.visible"
      :goal="deleteModal.goal"
      :date="deleteModal.date"
      @close="deleteModal.visible = false"
      @deleteAll="handleDeleteAll"
      @deleteFrom="handleDeleteFrom"
    />
  </div>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-leave-active,
.slide-right-leave-active {
  position: absolute;
  inset: 0;
}

.slide-left-enter-from  { transform: translateX(100%); }
.slide-left-leave-to    { transform: translateX(-100%); }
.slide-right-enter-from { transform: translateX(-100%); }
.slide-right-leave-to   { transform: translateX(100%); }

.fade-up-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-up-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(8px); }

.fire-particle {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  line-height: 1;
  animation: fireFloat 1.2s ease-out forwards;
}

@keyframes fireFloat {
  0%   { transform: translateY(0) translateX(0) scale(1);   opacity: 1; }
  60%  { opacity: 1; }
  100% { transform: translateY(-90px) translateX(var(--drift)) scale(0.3); opacity: 0; }
}

</style>
