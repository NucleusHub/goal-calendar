import { createApiClient } from '@core/createApiClient.js'

const api = createApiClient('/api/goals')

export const getGoals = () => api.get('')
export const createGoal = (data) => api.post('', data)
export const updateGoal = (id, data) => api.patch(`/${id}`, data)
export const toggleGoalDate = (id, date) => api.patch(`/${id}/toggle-date`, { date })
export const deleteGoal = (id) => api.del(`/${id}`)
