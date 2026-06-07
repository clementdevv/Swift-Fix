'use server'

import { requireProfile, requireSession } from './_auth'
import { prisma } from '@/lib/prisma'

export async function getCurrentUserProfile() {
  const { session, profile } = await requireProfile()
  return {
    id: profile.id,
    email: session.user.email ?? '',
    fullName: profile.fullName ?? '',
    userType: profile.userType === 'PROVIDER' ? 'provider' : 'customer',
    avatarUrl: profile.avatarUrl,
    phone: profile.phone,
    bio: profile.bio,
    location: profile.location,
  }
}

export async function updateProfile(data: {
  fullName?: string
  phone?: string
  bio?: string
  location?: string
}) {
  const session = await requireSession()
  await prisma.profile.update({
    where: { id: session.user.id },
    data,
  })
  return { success: true }
}