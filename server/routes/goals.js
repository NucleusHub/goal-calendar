import { Router } from 'express'
import Goal from '../models/Goal.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const goals = await Goal.find().sort({ createdAt: -1 })
    res.json(goals)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const goal = await Goal.create(req.body)
    res.status(201).json(goal)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!goal) return res.status(404).json({ error: 'Not found' })
    res.json(goal)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.patch('/:id/toggle-date', async (req, res) => {
  try {
    const { date } = req.body
    const goal = await Goal.findById(req.params.id)
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
    const goal = await Goal.findByIdAndDelete(req.params.id)
    if (!goal) return res.status(404).json({ error: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
