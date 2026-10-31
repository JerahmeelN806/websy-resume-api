import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { login, me, signup } from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'

export const authRouter = Router()
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { message: 'Too many attempts. Please try again later.' } } })

authRouter.post('/signup', authLimiter, signup)
authRouter.post('/login', authLimiter, login)
authRouter.get('/me', authenticate, me)
