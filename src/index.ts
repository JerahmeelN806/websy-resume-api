import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { errorHandler } from './middleware/errorHandler.js'
import { authRouter } from './routes/authRoutes.js'
import { resumeRouter } from './routes/resumeRoutes.js'

const app = express()
const requiredEnvironment = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL'] as const
for (const name of requiredEnvironment) {
  if (!process.env[name]) throw new Error(`${name} is required.`)
}
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET!.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production.')
}
const port = Number(process.env.PORT || 4000)
const allowedOrigins = new Set(process.env.CLIENT_URL!.split(',').map((origin) => origin.trim()).filter(Boolean))

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header are health checks or server-to-server traffic.
    if (!origin || allowedOrigins.has(origin)) return callback(null, true)
    return callback(new Error('Origin is not allowed by CORS'))
  },
}))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRouter)
app.use('/api/resumes', resumeRouter)
app.use((_req, res) => res.status(404).json({ error: { message: 'Route not found.' } }))
app.use(errorHandler)

app.listen(port, () => console.log(`Websy Resume API is listening on port ${port}`))
