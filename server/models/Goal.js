import mongoose from 'mongoose'

const goalSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    description:    { type: String, default: '' },
    color:          { type: String, default: '#6366f1' },
    repeat:         { type: String, enum: ['none', 'everyday', 'weekday', 'weekend', 'week', 'month', 'year', 'custom'], required: true },
    customInterval: { type: Number, default: null },
    customUnit:     { type: String, enum: ['days', 'weeks', 'months', 'years', null], default: null },
    startDate:      { type: String, required: true },
    completedDates:      { type: [String], default: [] },
    deletedFrom:         { type: String, default: null },
    countStreak:         { type: Boolean, default: true },
    watchlistItemId:     { type: String, default: null },
    watchlistItemTitle:  { type: String, default: null },
    watchlistItemPoster: { type: String, default: null },
  },
  { timestamps: true }
)

export default mongoose.model('Goal', goalSchema)
