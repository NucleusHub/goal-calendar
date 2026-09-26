import GoalUpdateCard from './GoalUpdateCard.vue'

const todayIso = () => new Date().toISOString().slice(0, 10)

function goalStreak(dates) {
  if (!dates?.length) return 0
  const set = new Set(dates)
  const iso = d => d.toISOString().slice(0, 10)
  const d = new Date()
  if (!set.has(iso(d))) d.setDate(d.getDate() - 1)
  let n = 0
  while (set.has(iso(d))) { n++; d.setDate(d.getDate() - 1) }
  return n
}

export default {
  app: 'goal-calendar',

  renderers: {
    'goal.update': GoalUpdateCard,
  },

  composerActions: {
    share_goal: {
      source: {
        title: 'Share a goal',
        layout: 'list',
        fetch: () => fetch('/api/goals', { credentials: 'include' }).then(r => r.json()),
        map: g => {
          const done = (g.completedDates || []).includes(todayIso())
          return {
            key: g._id,
            title: g.name,
            subtitle: done ? 'Completed today' : 'In progress',
            dot: g.color,
            message: { type: 'goal.update', payload: {
              goalId: g._id, name: g.name, color: g.color,
              status: done ? 'completed' : 'active', streak: goalStreak(g.completedDates), date: todayIso(),
              repeat: g.repeat, customInterval: g.customInterval, customUnit: g.customUnit, startDate: g.startDate,
            } },
          }
        },
      },
    },
  },
}
