import bcrypt from 'bcrypt'
import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  username: z.string().trim().min(3).max(30).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
})

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

const JWT_EXPIRES_IN = '7d'

function signToken(userId: string) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is missing.')
  return jwt.sign({ userId }, secret, { expiresIn: JWT_EXPIRES_IN })
}

function publicUser(user: { id: string; name: string; username: string | null; email: string; createdAt: Date }) {
  return user
}

export async function signup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: { message: 'Please check your sign-up details.', details: parsed.error.flatten() } })

  const { password, email, ...details } = parsed.data
  const user = await prisma.user.create({
    data: { ...details, email: email.toLowerCase(), password: await bcrypt.hash(password, 12) },
  })

  return res.status(201).json({ token: signToken(user.id), user: publicUser(user) })
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: { message: 'Email and password are required.' } })

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } })
  const passwordMatches = user ? await bcrypt.compare(parsed.data.password, user.password) : false
  if (!user || !passwordMatches) return res.status(401).json({ error: { message: 'Invalid email or password.' } })

  return res.json({ token: signToken(user.id), user: publicUser(user) })
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) return res.status(401).json({ error: { message: 'Invalid or expired token.' } })
  return res.json({ user: publicUser(user) })
}
