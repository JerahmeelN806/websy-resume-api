import type { ErrorRequestHandler } from 'express'
import { Prisma } from '../../generated/prisma/client.js'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error)

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return res.status(409).json({ error: { message: 'That value is already in use.' } })
  }

  return res.status(500).json({ error: { message: 'Something went wrong.' } })
}
