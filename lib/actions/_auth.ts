import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function requireSession() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireProfile() {
  const session = await requireSession()
  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    include: { providerProfile: true },
  })
  if (!profile) throw new Error('Profile not found')
  return { session, profile }
}
