'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signIn, signOut } from '@/lib/auth'
import { AuthError } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { UserType } from '@/lib/generated/prisma/client'

/* ========================= LOGIN ========================= */
export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Invalid email or password' }
    }
    throw error
  }

  // Fetch role for client-side redirect (login page uses this)
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      profile: { include: { providerProfile: true } },
    },
  })

  const userType = user?.profile?.userType
  const isProvider = userType === UserType.PROVIDER
  const isOnboarded = user?.profile?.providerProfile?.onboardingCompleted ?? false

  revalidatePath('/', 'layout')

  return {
    success: true,
    userRole: isProvider ? 'provider' : 'customer',
    isOnboarded,
  }
}

/* ========================= SIGNUP (customer) ========================= */
export async function signup(formData: FormData) {
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  const password = formData.get('password') as string
  const fullName = (formData.get('full_name') as string)?.trim()
  const userTypeRaw = (formData.get('user_type') as string) || 'customer'

  if (!email || !password || !fullName) {
    return { error: 'All fields are required' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'An account with this email already exists' }
  }

  const hashed = await bcrypt.hash(password, 12)

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: fullName,
          password: hashed,
        },
      })

      await tx.profile.create({
        data: {
          id: user.id,
          fullName,
          userType: userTypeRaw === 'provider' ? UserType.PROVIDER : UserType.CUSTOMER,
        },
      })
    })
  } catch {
    return { error: 'Signup failed. Please try again.' }
  }

  revalidatePath('/', 'layout')
  return { success: true, message: 'Account created. You can now sign in.' }
}

/* ========================= LOGOUT ========================= */
export async function logout() {
  await signOut({ redirect: false })
  revalidatePath('/', 'layout')
  return { success: true }
}

/* ========================= PROVIDER ONBOARDING ========================= */
export async function completeProviderOnboarding(payload: {
  authData: { email: string; password: string; fullName: string }
  onboardingData: {
    business_name: string
    bio: string
    phone: string
    location?: string | null
    years_exp?: string | null
    service_offered: string[]
    skills: string[]
    pricing_info: string
    payment_method: string
    payment_details: string
  }
}) {
  const { authData, onboardingData } = payload
  const email = authData.email.toLowerCase().trim()
  const fullName = authData.fullName.trim()
  const hashed = await bcrypt.hash(authData.password, 12)

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'An account with this email already exists' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, name: fullName, password: hashed },
      })

      await tx.profile.create({
        data: {
          id: user.id,
          fullName,
          phone: onboardingData.phone,
          userType: UserType.PROVIDER,
          providerProfile: {
            create: {
              businessName: onboardingData.business_name || 'Professional',
              bio: onboardingData.bio || null,
              phone: onboardingData.phone || null,
              location: onboardingData.location ?? null,
              yearsExp: onboardingData.years_exp ? parseInt(onboardingData.years_exp) : null,
              serviceOffered: onboardingData.service_offered.join(', '),
              skills: onboardingData.skills,
              pricingInfo: onboardingData.pricing_info || null,
              paymentMethod: onboardingData.payment_method || null,
              paymentDetails: onboardingData.payment_details || null,
              onboardingCompleted: true,
            },
          },
        },
      })
    })

    // Auto sign-in after provider account creation
    await signIn('credentials', {
      email,
      password: authData.password,
      redirect: false,
    })

    revalidatePath('/', 'layout')
    return { success: true, hasSession: true, message: 'Onboarding complete!' }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}

/* ========================= FORGOT PASSWORD (stub) ========================= */
export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string
  if (!email) return { error: 'Email is required' }

  // TODO: implement with Resend + VerificationToken table
  return { success: true }
}