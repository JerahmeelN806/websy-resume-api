import type { Request, Response } from 'express'
import { z } from 'zod'
import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'

const jsonObjectSchema = z.record(z.string(), z.unknown()).refine(
  (value) => JSON.stringify(value).length <= 200 * 1024,
  { message: 'Resume data must be 200 KB or less.' },
)

const resumeSchema = z.object({
  title: z.string().trim().min(1).max(150),
  template: z.string().trim().min(1).max(50).optional(),
  data: jsonObjectSchema.optional(),
  isPublic: z.boolean().optional(),
  publicSlug: z.string().trim().min(3).max(100).nullable().optional(),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

function resumeIdFromRequest(req: Request) {
  const { id } = req.params
  return Array.isArray(id) ? id[0] : id
}

export async function listResumes(req: Request, res: Response) {
  const parsed = paginationSchema.safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ error: { message: 'Please check the pagination values.', details: parsed.error.flatten() } })
  const { page, limit } = parsed.data
  const where = { userId: req.userId! }
  const [resumes, total] = await prisma.$transaction([
    prisma.resume.findMany({ where, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.resume.count({ where }),
  ])
  return res.json({ resumes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
}

export async function createResume(req: Request, res: Response) {
  const parsed = resumeSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: { message: 'Please check the resume details.', details: parsed.error.flatten() } })
  const resume = await prisma.resume.create({
    data: { ...parsed.data, data: parsed.data.data as Prisma.InputJsonValue | undefined, userId: req.userId! },
  })
  return res.status(201).json({ resume })
}

export async function getResume(req: Request, res: Response) {
  const resume = await prisma.resume.findFirst({ where: { id: resumeIdFromRequest(req), userId: req.userId! } })
  if (!resume) return res.status(404).json({ error: { message: 'Resume not found.' } })
  return res.json({ resume })
}

export async function updateResume(req: Request, res: Response) {
  const parsed = resumeSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: { message: 'Please check the resume details.', details: parsed.error.flatten() } })
  const updated = await prisma.resume.updateMany({
    where: { id: resumeIdFromRequest(req), userId: req.userId! },
    data: { ...parsed.data, data: parsed.data.data as Prisma.InputJsonValue | undefined },
  })
  if (!updated.count) return res.status(404).json({ error: { message: 'Resume not found.' } })
  const resume = await prisma.resume.findUniqueOrThrow({ where: { id: resumeIdFromRequest(req) } })
  return res.json({ resume })
}

export async function deleteResume(req: Request, res: Response) {
  const deleted = await prisma.resume.deleteMany({ where: { id: resumeIdFromRequest(req), userId: req.userId! } })
  if (!deleted.count) return res.status(404).json({ error: { message: 'Resume not found.' } })
  return res.status(204).send()
}
