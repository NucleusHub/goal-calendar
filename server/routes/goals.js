import { Router } from 'express'
import Goal from '../models/Goal.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

function requireAdmin(req, res, next) {
  if (req.profile?.role !== 'admin') return res.status(403).json({ error: 'Admin required' })
  next()
}

// Called by the admin panel when a user is deleted: drop all their goals.
//   POST /api/goals/users/:userId/teardown
router.post('/users/:userId/teardown', requireAdmin, async (req, res) => {
  try {
    const { deletedCount } = await Goal.deleteMany({ profileId: req.params.userId })
    res.json({ ok: true, deleted: deletedCount })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find({ profileId: req.profile.profileId }).sort({ createdAt: -1 })
    res.json(goals)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const goal = await Goal.create({ ...req.body, profileId: req.profile.profileId })
    res.status(201).json(goal)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, profileId: req.profile.profileId },
      req.body,
      { new: true, runValidators: true }
    )
    if (!goal) return res.status(404).json({ error: 'Not found' })
    res.json(goal)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.patch('/:id/toggle-date', async (req, res) => {
  try {
    const { date } = req.body
    const goal = await Goal.findOne({ _id: req.params.id, profileId: req.profile.profileId })
    if (!goal) return res.status(404).json({ error: 'Not found' })
    const idx = goal.completedDates.indexOf(date)
    if (idx === -1) goal.completedDates.push(date)
    else goal.completedDates.splice(idx, 1)
    await goal.save()
    res.json(goal)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, profileId: req.profile.profileId })
    if (!goal) return res.status(404).json({ error: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
