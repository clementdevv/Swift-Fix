import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { AUTH_STRINGS } from '@/lib/constants/auth'

const RESET_TOKEN_BYTES = 32

export function generatePasswordResetToken(): string {
  return randomBytes(RESET_TOKEN_BYTES).toString('hex')
}

export function getPasswordResetExpiry(): Date {
  const expires = new Date()
  expires.setHours(expires.getHours() + AUTH_STRINGS.passwordResetExpiryHours)
  return expires
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const token = generatePasswordResetToken()
  const expires = getPasswordResetExpiry()

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  })

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  })

  return token
}

export async function validatePasswordResetToken(token: string) {
  const record = await prisma.verificationToken.findFirst({
    where: {
      token,
      expires: { gt: new Date() },
    },
  })

  if (!record) {
    return null
  }

  return record
}

export async function deletePasswordResetToken(token: string) {
  await prisma.verificationToken.deleteMany({
    where: { token },
  })
}
