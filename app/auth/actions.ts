'use server'

import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signIn, signOut } from '@/lib/auth'
import { AuthError } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { UserType } from '@/lib/generated/prisma/client'
import { AUTH_STRINGS } from '@/lib/constants/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import {
  createPasswordResetToken,
  validatePasswordResetToken,
} from '@/lib/password-reset'
import { passwordsMatch, validatePassword } from '@/lib/validation/password'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

/* ========================= LOGIN ========================= */
export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.toLowerCase().trim()
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
    where: { email },
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

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return { error: passwordValidation.error }
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
  } catch (error) {
    console.error('Signup failed:', error)
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

  const passwordValidation = validatePassword(authData.password)
  if (!passwordValidation.valid) {
    return { error: passwordValidation.error }
  }

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

/* ========================= FORGOT PASSWORD ========================= */
export async function forgotPassword(formData: FormData) {
  const email = (formData.get('email') as string)?.toLowerCase().trim()
  if (!email) return { error: 'Email is required' }

  try {
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      console.error('Supabase reset password error:', error)
      return { error: error.message }
    }
  } catch (error) {
    console.error('Forgot password email failed:', error)
    return { error: 'An unexpected error occurred' }
  }

  return { success: true, message: AUTH_STRINGS.forgotPasswordSuccess }
}

/* ========================= RESET PASSWORD ========================= */
export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return { error: 'Password and confirmation are required' }
  }

  if (!passwordsMatch(password, confirmPassword)) {
    return { error: AUTH_STRINGS.passwordsDoNotMatch }
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return { error: passwordValidation.error }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      console.error('Supabase update password error:', error)
      return { error: error.message }
    }
  } catch (error) {
    console.error('Reset password failed:', error)
    return { error: 'Failed to reset password. Please try again.' }
  }

  return { success: true, message: AUTH_STRINGS.resetPasswordSuccess }
}