import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/asyncHandler'
import * as controller from './controller'

export const timeRoutes = Router()

timeRoutes.get('/categories', asyncHandler(controller.getCategories))

timeRoutes.use(authMiddleware)

// Tasks (day planning)
timeRoutes.get('/tasks', asyncHandler(controller.getTasks))
timeRoutes.post('/tasks', asyncHandler(controller.createTask))
timeRoutes.put('/tasks/:id', asyncHandler(controller.updateTask))
timeRoutes.delete('/tasks/:id', asyncHandler(controller.deleteTask))

// Routines
timeRoutes.get('/routines', asyncHandler(controller.getRoutines))
timeRoutes.post('/routines', asyncHandler(controller.createRoutine))
timeRoutes.put('/routines/:id', asyncHandler(controller.updateRoutine))
timeRoutes.delete('/routines/:id', asyncHandler(controller.deleteRoutine))

// Legacy time-tracking entries
timeRoutes.post('/entries/start', asyncHandler(controller.startEntry))
timeRoutes.post('/entries/:id/stop', asyncHandler(controller.stopEntry))
timeRoutes.get('/entries/active', asyncHandler(controller.getActiveEntries))
timeRoutes.get('/entries', asyncHandler(controller.getEntries))
timeRoutes.delete('/entries/:id', asyncHandler(controller.deleteEntry))

timeRoutes.get('/budget', asyncHandler(controller.getBudget))
timeRoutes.put('/budget', asyncHandler(controller.saveBudget))
