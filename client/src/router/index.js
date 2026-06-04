import { createRouter, createWebHistory } from 'vue-router'
import CalendarView from '@/views/CalendarView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/goals/', component: CalendarView },
    { path: '/goals', redirect: '/goals/' },
  ],
})
