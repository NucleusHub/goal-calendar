import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import goalsRoutes from './routes/goals.js'
import { requireAppEnabled } from './core/server/appAccess.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.get('/api/goals/health', (_, res) => res.json({ ok: true }))
app.use('/api/goals', requireAppEnabled('goal-calendar'))
app.use('/api/goals', goalsRoutes)

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })
