import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth'
import { asyncHandler } from '../../middleware/asyncHandler'
import * as controller from './controller'

export const householdRoutes = Router()

// All household routes require auth
householdRoutes.use(authMiddleware)

// --- Tasks ---
householdRoutes.get('/tasks', asyncHandler(controller.listTasks))
householdRoutes.post('/tasks', asyncHandler(controller.createTask))
householdRoutes.get('/tasks/upcoming', asyncHandler(controller.getUpcomingTasks))
householdRoutes.post('/tasks/generate', asyncHandler(controller.generateTasks))
householdRoutes.post('/tasks/:id/complete', asyncHandler(controller.completeTask))
householdRoutes.post('/tasks/:id/skip', asyncHandler(controller.skipTask))

// --- Templates ---
householdRoutes.get('/templates', asyncHandler(controller.listTemplates))
householdRoutes.post('/templates', asyncHandler(controller.createTemplate))
householdRoutes.put('/templates/:id', asyncHandler(controller.updateTemplate))
householdRoutes.delete('/templates/:id', asyncHandler(controller.deleteTemplate))

// --- Cleaner Rotation ---
householdRoutes.get('/cleaner-rotation', asyncHandler(controller.getCleanerRotation))
householdRoutes.put('/cleaner-rotation', asyncHandler(controller.updateCleanerRotation))

// --- Property Profile ---
householdRoutes.get('/property', asyncHandler(controller.getPropertyProfile))
householdRoutes.put('/property', asyncHandler(controller.updatePropertyProfile))
