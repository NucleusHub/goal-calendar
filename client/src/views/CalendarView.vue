<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { animate } from 'animejs'
import confetti from 'canvas-confetti'
import AppSidebar from '@core/AppSidebar.vue'
import AppHeader from '@core/AppHeader.vue'
import BackgroundBlobs from '@core/BackgroundBlobs.vue'
import GoalModal from '@/components/GoalModal.vue'
import GoalContextMenu from '@/components/GoalContextMenu.vue'
import EditGoalModal from '@/components/EditGoalModal.vue'
import DeleteGoalModal from '@/components/DeleteGoalModal.vue'
import { getGoals, createGoal, updateGoal, deleteGoal, toggleGoalDate } from '@/api/goals.js'
import { Icon } from '@core/icons'
import ChevronLeftIcon from '@/assets/icons/chevron-left.svg?component'
import SparklesIcon from '@/assets/icons/sparkles.svg?component'

const sidebarOpen = ref(false)

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const monthLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value).toLocaleString('default', { month: 'long', year: 'numeric' })
)
const monthLabelShort = computed(() =>
  new Date(currentYear.value, currentMonth.value).toLocaleString('default', { month: 'short', year: 'numeric' })
)

const animPanelOpen = ref(false)

const viewport = ref(null)
const dragX = ref(0)
const dragging = ref(false)
const instant = ref(false)
const animating = ref(false)
const jumpOverride = ref(null)

function shiftMonth(year, month, delta) {
  const idx = year * 12 + month + delta
  return { year: Math.floor(idx / 12), month: ((idx % 12) + 12) % 12 }
}

function buildDays(year, month) {
  const last = new Date(year, month + 1, 0)
  const startPad = (new Date(year, month, 1).getDay() + 6) % 7
  const days = []
  for (let i = startPad - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), inMonth: false })
  for (let d = 1; d <= last.getDate(); d++) days.push({ date: new Date(year, month, d), inMonth: true })
  while (days.length < 42) days.push({ date: new Date(year, month + 1, days.length - startPad - last.getDate() + 1), inMonth: false })
  return days
}

const panels = computed(() => [-1, 0, 1].map(delta => {
  let { year, month } = shiftMonth(currentYear.value, currentMonth.value, delta)
  const ov = jumpOverride.value
  if (ov && ((ov.side === 'next' && delta === 1) || (ov.side === 'prev' && delta === -1))) {
    year = ov.year
    month = ov.month
  }
  return { key: `${year}-${month}`, year, month, days: buildDays(year, month) }
}))

function slideTo(delta) {
  if (animating.value) { dragging.value = false; dragX.value = 0; return }
  const w = viewport.value?.offsetWidth ?? 0
  if (delta === 0 || w === 0) { dragging.value = false; dragX.value = 0; return }
  const target = shiftMonth(currentYear.value, currentMonth.value, delta)

  const run = () => {
    animating.value = true
    dragging.value = false
    dragX.value = delta > 0 ? -w : w
    setTimeout(() => {
      instant.value = true
      currentYear.value = target.year
      currentMonth.value = target.month
      jumpOverride.value = null
      dragX.value = 0
      nextTick(() => requestAnimationFrame(() => {
        instant.value = false
        animating.value = false
      }))
    }, 260)
  }

  if (Math.abs(delta) === 1) {
    run()
  } else {
    jumpOverride.value = { side: delta > 0 ? 'next' : 'prev', year: target.year, month: target.month }
    nextTick(() => requestAnimationFrame(run))
  }
}

function prevMonth() { slideTo(-1) }
function nextMonth() { slideTo(1) }

function goToday() {
  const delta = (today.getFullYear() * 12 + today.getMonth()) - (currentYear.value * 12 + currentMonth.value)
  if (delta !== 0) slideTo(delta)
}

let touchStartX = 0
let touchStartY = 0
let axisLock = null
let didSwipe = false

const SWIPE_THRESHOLD = 60

function onGridTouchStart(e) {
  if (animating.value || e.touches.length !== 1) return
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  axisLock = null
  didSwipe = false
  dragging.value = true
}

function onGridTouchMove(e) {
  if (!dragging.value || e.touches.length !== 1) return
  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY
  if (!axisLock && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
    axisLock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
  }
  if (axisLock === 'x') dragX.value = dx
}

function onGridTouchEnd() {
  if (!dragging.value) return
  const dx = dragX.value
  if (axisLock === 'x' && Math.abs(dx) > SWIPE_THRESHOLD) {
    didSwipe = true
    slideTo(dx < 0 ? 1 : -1)
  } else {
    dragging.value = false
    dragX.value = 0
  }
  axisLock = null
}

function isToday(date) {
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function isWeekend(date) {
  const d = date.getDay()
  return d === 0 || d === 6
}

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
  for (const panel of panels.value) {
    for (const day of panel.days) {
      const key = dateKey(day.date)
      if (!map.has(key)) map.set(key, goals.value.filter(g => appearsOnDay(g, day.date)))
    }
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
        break
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

const ANIM_KEY = 'nucleus-goals-anim'
const anim = ref(JSON.parse(localStorage.getItem(ANIM_KEY) ?? 'null') ?? { confetti: true, flames: true, ring: true })
watch(anim, v => localStorage.setItem(ANIM_KEY, JSON.stringify(v)), { deep: true })
const animAll = computed(() => anim.value.confetti && anim.value.flames && anim.value.ring)
function toggleAll() {
  const next = !animAll.value
  anim.value = { confetti: next, flames: next, ring: next }
}

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

const ctxMenu = ref({ visible: false, x: 0, y: 0, goal: null, date: null })

function onChipRightClick(e, goal, date) {
  e.preventDefault()
  e.stopPropagation()
  ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY, goal, date }
}

let pressTimer = null
let longPressed = false

function onChipTouchStart(e, goal, date) {
  longPressed = false
  const t = e.touches?.[0]
  if (!t) return
  const x = t.clientX, y = t.clientY
  pressTimer = setTimeout(() => {
    longPressed = true
    try { navigator.vibrate?.(15) } catch {}
    ctxMenu.value = { visible: true, x, y, goal, date }
  }, 420)
}

function cancelPress() {
  clearTimeout(pressTimer)
}

function onChipClick(goal, date, e) {
  if (didSwipe) return
  if (longPressed) { longPressed = false; return }
  toggleCompletion(goal, date, e)
}

const editModal = ref({ visible: false, goal: null })

async function submitEdit(fields) {
  const updated = await updateGoal(editModal.value.goal._id, fields)
  const idx = goals.value.findIndex(g => g._id === updated._id)
  if (idx !== -1) goals.value.splice(idx, 1, updated)
}

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

const modalOpen = ref(false)
const selectedDay = ref(null)

function openModal(day) {
  if (didSwipe) return
  selectedDay.value = day
  modalOpen.value = true
}
</script>

<template>
  <div class="relative min-h-screen bg-slate-100 dark:bg-[#0d0d1a] text-slate-900 dark:text-white flex flex-col overflow-x-hidden">
    <BackgroundBlobs />

    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <AppHeader>
      <template #left>
        <button
          @click="sidebarOpen = true"
          class="nuc-press cursor-pointer p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/8 dark:hover:bg-white/10 transition-colors"
        >
          <Icon name="menu" class="w-5 h-5" />
        </button>
      </template>

      <button @click="prevMonth" aria-label="Previous month" class="nuc-press nav-arrow">
        <ChevronLeftIcon class="w-4 h-4" />
      </button>
      <h1 class="nav-month">
        <span class="sm:hidden">{{ monthLabelShort }}</span>
        <span class="hidden sm:inline">{{ monthLabel }}</span>
      </h1>
      <button @click="nextMonth" aria-label="Next month" class="nuc-press nav-arrow">
        <Icon name="chevronRight" class="w-4 h-4" :sw="2.5" />
      </button>
      <button @click="goToday" class="nuc-press today-btn">
        <span class="today-dot" />
        Today
      </button>

      <template #right>
        <div class="relative">
          <button
            @click="animPanelOpen = !animPanelOpen"
            title="Animations"
            :class="[
              'nuc-press cursor-pointer p-2 rounded-lg transition-colors',
              animPanelOpen
                ? 'text-indigo-600 dark:text-indigo-400 bg-black/8 dark:bg-white/10'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/8 dark:hover:bg-white/10'
            ]"
          >
            <SparklesIcon class="w-5 h-5" />
          </button>

          <div v-if="animPanelOpen" class="fixed inset-0 z-40" @click="animPanelOpen = false" />
          <div
            v-if="animPanelOpen"
            class="nuc-in-scale absolute right-0 top-full mt-2 w-48 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-xl border border-white/60 dark:border-white/10 p-3 flex flex-col gap-3 shadow-lg shadow-indigo-500/10 dark:shadow-black/30"
          >
            <p class="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Animations</p>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <span class="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200">✨ All</span>
                <button type="button" @click="toggleAll"
                  :class="['relative w-8 h-4 rounded-full transition-colors shrink-0 cursor-pointer', animAll ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700']">
                  <span :class="['absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform', animAll ? 'translate-x-4' : 'translate-x-0']" />
                </button>
              </div>
              <div class="border-t border-black/8 dark:border-white/8" />
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
        </div>
      </template>
    </AppHeader>

    <main class="relative z-10 flex-1 px-3 sm:px-6 pt-2 sm:pt-4 pb-8 w-full">
      <div class="relative max-w-3xl mx-auto">
      <div class="cal-card nuc-in">
        <div class="grid grid-cols-7 px-1 mb-1.5 sm:mb-2">
          <div
            v-for="(day, di) in DAYS"
            :key="day"
            class="text-center text-[11px] font-semibold uppercase tracking-[0.14em] py-1"
            :class="di >= 5 ? 'text-indigo-500/70 dark:text-indigo-300/60' : 'text-slate-400/90 dark:text-slate-500'"
          >
            <span class="sm:hidden">{{ day[0] }}</span>
            <span class="hidden sm:inline">{{ day }}</span>
          </div>
        </div>

        <div
          ref="viewport"
          class="overflow-hidden relative"
          @touchstart.passive="onGridTouchStart"
          @touchmove.passive="onGridTouchMove"
          @touchend="onGridTouchEnd"
          @touchcancel="onGridTouchEnd"
        >
          <div
            class="month-track"
            :class="{ 'is-dragging': dragging, 'is-instant': instant }"
            :style="{ transform: `translateX(calc(-33.3333% + ${dragX}px))` }"
          >
            <div v-for="panel in panels" :key="panel.key" class="month-panel">
              <div class="grid grid-cols-7 gap-1 sm:gap-1.5">
                <div
                  v-for="(day, i) in panel.days"
                  :key="i"
                  @click="openModal(day)"
                  class="day-cell group/day min-h-[60px] sm:min-h-[104px] p-1 sm:p-2 flex flex-col gap-1 relative cursor-pointer"
                  :class="{ 'is-outside': !day.inMonth, 'is-today': isToday(day.date) }"
                >
                  <div class="flex items-center justify-between">
                    <span
                      class="text-xs sm:text-sm font-semibold tabular-nums w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full shrink-0 transition-colors"
                      :class="isToday(day.date)
                        ? 'today-num'
                        : isWeekend(day.date)
                          ? 'text-slate-400 dark:text-slate-500'
                          : 'text-slate-600 dark:text-slate-200'"
                    >
                      {{ day.date.getDate() }}
                    </span>
                    <span class="add-hint opacity-0 sm:group-hover/day:opacity-100">
                      <Icon name="plus" class="w-3 h-3" :sw="2.5" />
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-1 sm:gap-1.5 mt-0.5">
                    <button
                      v-for="goal in goalsPerDay.get(dateKey(day.date)) ?? []"
                      :key="goal._id"
                      @click.stop="onChipClick(goal, day.date, $event)"
                      @contextmenu.stop="onChipRightClick($event, goal, day.date)"
                      @touchstart.passive="onChipTouchStart($event, goal, day.date)"
                      @touchend="cancelPress"
                      @touchmove.passive="cancelPress"
                      @touchcancel="cancelPress"
                      class="chip w-3.5 h-3.5 sm:w-6 sm:h-6 text-[10px] sm:text-xs"
                      :class="[
                        isFuture(day.date) ? 'is-future' : 'is-actionable',
                        isCompletedOnDay(goal, day.date) ? 'is-done' : '',
                      ]"
                      :style="{ '--c': goal.color }"
                      :title="goal.name"
                    >
                      <Icon name="checkBold" v-if="isCompletedOnDay(goal, day.date)" class="hidden sm:block w-3 h-3" :sw="3.25" />
                      <span v-else class="hidden sm:block select-none">{{ goal.name[0].toUpperCase() }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Transition name="fade-up">
        <div v-if="streakGoals.length" class="mt-6 flex flex-col gap-3 px-1">
          <p class="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.14em]">Active streaks</p>
          <div class="flex flex-wrap gap-2.5">
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
              <div class="streak-pill relative flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-[10px]">
                <div class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" :style="{ backgroundColor: goal.color }" />
                <span class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ goal.name }}</span>
                <span class="ml-0.5 flex items-center gap-1 text-sm font-bold tabular-nums text-orange-500">
                  {{ streak }}<span class="text-base leading-none">🔥</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
      </div>
    </main>

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
.nav-arrow {
  display: flex;
  padding: 7px;
  border-radius: 9999px;
  color: rgb(100 116 139);
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease;
}
.nav-arrow:hover { color: rgb(15 23 42); background: rgba(15, 23, 42, 0.06); }
.dark .nav-arrow { color: rgb(148 163 184); }
.dark .nav-arrow:hover { color: #fff; background: rgba(255, 255, 255, 0.10); }

.nav-month {
  min-width: 108px;
  padding: 0 4px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-align: center;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
@media (min-width: 640px) { .nav-month { min-width: 176px; font-size: 16px; } }

.today-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(71 85 105);
  border: 1px solid rgba(15, 23, 42, 0.10);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.today-btn:hover { background: rgba(15, 23, 42, 0.05); border-color: rgba(15, 23, 42, 0.16); }
.dark .today-btn { color: rgb(203 213 225); border-color: rgba(255, 255, 255, 0.14); }
.dark .today-btn:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.22); }
.today-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.7);
}

.cal-card {
  padding: 12px;
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.55));
  backdrop-filter: blur(28px) saturate(1.5);
  -webkit-backdrop-filter: blur(28px) saturate(1.5);
  border: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow:
    0 32px 64px -32px rgba(49, 46, 129, 0.4),
    0 8px 20px -14px rgba(15, 23, 42, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}
@media (min-width: 640px) { .cal-card { padding: 20px; border-radius: 32px; } }
.dark .cal-card {
  background: linear-gradient(180deg, rgba(42, 35, 78, 0.72), rgba(24, 20, 48, 0.62));
  border-color: rgba(150, 130, 255, 0.16);
  box-shadow:
    0 36px 72px -32px rgba(0, 0, 0, 0.75),
    inset 0 1px 0 rgba(180, 150, 255, 0.09);
}

.day-cell {
  border-radius: 14px;
  transition: background-color 0.15s ease;
}
.day-cell.is-outside { opacity: 0.42; }
.day-cell.is-today { background: rgba(99, 102, 241, 0.07); }
.dark .day-cell.is-today { background: rgba(129, 140, 248, 0.10); }
@media (hover: hover) {
  .day-cell:hover { background: rgba(255, 255, 255, 0.6); }
  .dark .day-cell:hover { background: rgba(255, 255, 255, 0.05); }
  .day-cell.is-today:hover { background: rgba(99, 102, 241, 0.12); }
  .dark .day-cell.is-today:hover { background: rgba(129, 140, 248, 0.15); }
}

.today-num {
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 3px 10px -2px rgba(99, 102, 241, 0.6);
}

.add-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 9999px;
  color: rgb(148 163 184);
  background: rgba(100, 116, 139, 0.14);
  transition: opacity 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}
.group\/day:hover .add-hint { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }

.chip {
  --c: #6366f1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 9999px;
  font-weight: 700;
  line-height: 1;
  color: var(--c);
  background: color-mix(in srgb, var(--c) 14%, transparent);
  border: 1.5px solid color-mix(in srgb, var(--c) 42%, transparent);
  transition: transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
}
.dark .chip { background: color-mix(in srgb, var(--c) 24%, transparent); }
.chip.is-done {
  color: #fff;
  background: var(--c);
  border-color: transparent;
  box-shadow: 0 3px 10px -2px color-mix(in srgb, var(--c) 70%, transparent);
}
.chip.is-actionable { cursor: pointer; }
.chip.is-actionable:hover { transform: scale(1.15) translateY(-1px); }
.chip.is-actionable:active { transform: scale(0.92); }
.chip.is-future { opacity: 0.4; cursor: default; }

.streak-pill {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 14px -8px rgba(15, 23, 42, 0.25);
}
.dark .streak-pill {
  background: rgba(30, 27, 58, 0.7);
  border-color: rgba(255, 255, 255, 0.08);
}

.month-track {
  display: flex;
  width: 300%;
  transition: transform 0.24s cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
  touch-action: pan-y;
}
.month-track.is-dragging,
.month-track.is-instant {
  transition: none;
}
.month-panel {
  flex: 0 0 33.3333%;
  width: 33.3333%;
}

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
