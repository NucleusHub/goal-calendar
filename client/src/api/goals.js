import { createApiClient } from '@core/createApiClient.js'

// Endpoint map over the shared @core REST helper (credentials, JSON, error
// shaping, 403 APP_DISABLED handling all live there).
const api = createApiClient('/api/goals')

export const getGoals = () => api.get('')
export const createGoal = (data) => api.post('', data)
export const updateGoal = (id, data) => api.patch(`/${id}`, data)
export const toggleGoalDate = (id, date) => api.patch(`/${id}/toggle-date`, { date })
export const deleteGoal = (id) => api.del(`/${id}`)
