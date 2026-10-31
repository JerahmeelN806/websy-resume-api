import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

type TokenPayload = { userId: string }

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined

  if (!token) return res.status(401).json({ error: { message: 'Authentication required.' } })

  try {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET is missing.')
    const payload = jwt.verify(token, secret) as TokenPayload
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: { message: 'Invalid or expired token.' } })
  }
}
