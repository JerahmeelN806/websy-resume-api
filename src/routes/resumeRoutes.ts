import { Router } from 'express'
import { createResume, deleteResume, getResume, listResumes, updateResume } from '../controllers/resumeController.js'
import { authenticate } from '../middleware/authenticate.js'

export const resumeRouter = Router()
resumeRouter.use(authenticate)
resumeRouter.get('/', listResumes)
resumeRouter.post('/', createResume)
resumeRouter.get('/:id', getResume)
resumeRouter.patch('/:id', updateResume)
resumeRouter.delete('/:id', deleteResume)
