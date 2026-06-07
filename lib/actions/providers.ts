'use server'

import { prisma } from '@/lib/prisma'
import { requireProfile } from './_auth'

export async function getOnboardedProviders() {
  const providers = await prisma.serviceProvider.findMany({
    where: { onboardingCompleted: true },
    include: {
      profile: { select: { fullName: true } },
    },
  })

  return providers.map((p) => ({
    user_id: p.userId,
    business_name: p.businessName,
    bio: p.bio,
    skills: p.skills,
    service_offered: p.serviceOffered,
    years_exp: p.yearsExp,
    pricing_info: p.pricingInfo,
    categories: p.categories,
    profiles: { full_name: p.profile.fullName },
  }))
}

export async function getProviderSettings() {
  const { session, profile } = await requireProfile()

  const provider = profile.providerProfile

  return {
    full_name: profile.fullName ?? '',
    phone: profile.phone ?? '',
    location: profile.location ?? '',
    bio: profile.bio ?? '',
    email: session.user.email ?? '',
    business_name: provider?.businessName ?? '',
    primary_service: provider?.categories?.[0] ?? provider?.serviceOffered ?? '',
  }
}

export async function updateProviderSettings(data: {
  full_name?: string
  phone?: string
  location?: string
  bio?: string
  business_name?: string
  primary_service?: string
}) {
  const { session, profile } = await requireProfile()

  await prisma.profile.update({
    where: { id: session.user.id },
    data: {
      fullName: data.full_name,
      phone: data.phone,
      location: data.location,
      bio: data.bio,
    },
  })

  if (profile.providerProfile) {
    const categories = data.primary_service
      ? [data.primary_service, ...profile.providerProfile.categories.filter((c) => c !== data.primary_service)]
      : undefined

    await prisma.serviceProvider.update({
      where: { userId: session.user.id },
      data: {
        businessName: data.business_name,
        ...(categories ? { categories } : {}),
      },
    })
  }

  return { success: true }
}
