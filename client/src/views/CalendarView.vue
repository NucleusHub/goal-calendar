<script setup>
import { ref, computed } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'

const sidebarOpen = ref(false)

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const monthLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value).toLocaleString('default', { month: 'long', year: 'numeric' })
)

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}

function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}

function goToday() {
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth()
}

const calendarDays = computed(() => {
  const first = new Date(currentYear.value, currentMonth.value, 1)
  const last = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startPad = (first.getDay() + 6) % 7 // Monday-first offset
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
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <!-- Header -->
    <header class="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 px-4 py-3">
      <button
        @click="sidebarOpen = true"
        class="cursor-pointer p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div class="flex items-center gap-2 flex-1">
        <button
          @click="prevMonth"
          class="cursor-pointer p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <h1 class="text-base font-semibold min-w-40 text-center">{{ monthLabel }}</h1>

        <button
          @click="nextMonth"
          class="cursor-pointer p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <button
          @click="goToday"
          class="cursor-pointer ml-1 px-3 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Today
        </button>
      </div>
    </header>

    <!-- Calendar -->
    <main class="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
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

      <!-- Day grid -->
      <div class="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div
          v-for="(day, i) in calendarDays"
          :key="i"
          class="bg-white dark:bg-slate-900 min-h-24 p-2 flex flex-col gap-1"
          :class="!day.inMonth ? 'opacity-40' : ''"
        >
          <span
            :class="[
              'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full self-start',
              isToday(day.date)
                ? 'bg-indigo-600 text-white'
                : 'text-slate-700 dark:text-slate-300'
            ]"
          >
            {{ day.date.getDate() }}
          </span>
        </div>
      </div>
    </main>
  </div>
</template>
