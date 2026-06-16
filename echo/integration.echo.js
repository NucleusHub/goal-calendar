import GoalUpdateCard from './GoalUpdateCard.vue'

// Goals' Echo client integration — the single file Echo auto-discovers for this
// app. Owns the renderer for its message type plus the "share a goal" composer
// action. The matching server-side declaration is manifest.echo.json alongside.

const todayIso = () => new Date().toISOString().slice(0, 10)

// Consecutive-day streak ending today (or yesterday if today isn't done yet).
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

  // `source` drives Echo's generic share picker: load the user's items, then map
  // each to a picker row carrying the goal.update message to send when picked.
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
