'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/* =========================
   LOGIN
========================= */
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 🔍 DEBUG LOGS
  console.log('Login attempt:', { email: email ? email.substring(0, 3) + '***' : 'missing', hasPassword: !!password })

  if (!email || !password) {
    console.log('Missing credentials')
    return { error: 'Email and password are required' }
  }

  try {
    // Check user exists first
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const userExists = users.find(u => u.email === email.toLowerCase())
    console.log('User exists in auth:', !!userExists, 'email confirmed:', userExists?.email_confirmed_at)

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.log('Supabase auth error:', error.message, 'code:', error.code)
      
      // If it's a confirmation error, we might still have the user object in some cases
      // but usually signInWithPassword just fails. 
      if (error.message.toLowerCase().includes('confirm') || error.message.toLowerCase().includes('email')) {
         console.log('Email confirmation issues detected, but proceeding with check...')
      } else {
         return { error: error.message }
      }
    }

    const user = data?.user || (await supabase.auth.getUser()).data.user
    const session = data?.session

    console.log('Login result - User:', !!user, 'Session:', !!session)

    if (!user) {
      console.log('No user data found after sign-in attempt')
      return { error: 'Invalid email or password' }
    }

    // If we have a user but no session, it might be an unconfirmed email.
    // In many dev environments, we want to allow this.
    if (user && !session) {
      console.log('User found but no session. This usually means email is unconfirmed.')
    }

  // ✅ SAFE profile fetch
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle()

  const userRole = profile?.user_type || 'customer'

  console.log('User role:', userRole)

  // ✅ Provider redirect
  if (userRole === 'provider') {
    // Check if onboarded by verifying onboarding_completed boolean
    const { data: provider } = await supabase
      .from('service_providers')
      .select('onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle()
      
    const isOnboarded = provider?.onboarding_completed === true
    
    console.log('Redirecting to provider dashboard, onboarded:', isOnboarded)
    revalidatePath('/', 'layout')
    return { success: true, userRole: 'provider', isOnboarded }
  }

  // if (userRole === 'admin') {
  //   console.log('Redirecting to admin')
  //   revalidatePath('/', 'layout')
  //   return { success: true, userRole: 'admin' }
  // }

  console.log('Redirecting to client dashboard')
  revalidatePath('/', 'layout')
  return { success: true, userRole: 'customer' }

  } catch (error) {
    console.error('Login function error:', error)
    return { error: 'Login failed' }
  }
}


/* =========================
   SIGNUP
========================= */
// Signup function for user registration
export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const userType = (formData.get('user_type') as string) || 'customer'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        user_type: userType, // 🔥 REQUIRED for trigger
      },
    },
  })

  if (error) {
    return { error: 'Signup failed. ' + error.message }
  }

  // 🚫 DO NOTHING ELSE HERE
  // Trigger handles:
  // - profiles
  // - service_providers (if provider)

  revalidatePath('/', 'layout')
  return { success: true, message: 'Check email to continue' }
}


/* =========================
   LOGOUT
========================= */
export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: 'Could not sign out' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

/* =========================
   COMPLETE PROVIDER ONBOARDING
========================= */
export async function completeProviderOnboarding(payload: {
  authData: any;
  onboardingData: {
    business_name: string;
    bio: string;
    phone: string;
    location?: string | null;
    years_exp?: string | null;
    service_offered: string[];
    skills: string[];
    pricing_info: string;
    payment_method: string;
    payment_details: string;
  };
}) {
  const supabase = await createClient()
  const { authData, onboardingData } = payload

  // Explicitly sanitize and type-guard each field
  const business_name = String(onboardingData?.business_name || '').trim()
  const bio = String(onboardingData?.bio || '').trim()
  const phone = String(onboardingData?.phone || '').trim()
  const location = onboardingData?.location ? String(onboardingData.location).trim() : null
  const years_exp = onboardingData?.years_exp ? parseInt(String(onboardingData.years_exp)) : null
  const service_offered = Array.isArray(onboardingData?.service_offered) ? onboardingData.service_offered : []
  const skills = Array.isArray(onboardingData?.skills) ? onboardingData.skills : []
  const pricing_info = String(onboardingData?.pricing_info || '').trim()
  const payment_method = String(onboardingData?.payment_method || '').trim()
  const payment_details = String(onboardingData?.payment_details || '').trim()

  const cleanFullName = String(authData?.fullName || '').trim()
  const cleanEmail = String(authData?.email || '').toLowerCase().trim()

  console.log('--- Provider Onboarding Start ---')
  console.log('User:', cleanEmail)

  try {
    // 1. Create the Auth account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: authData.password,
      options: {
        data: {
          full_name: cleanFullName,
          business_name: business_name,
          phone: phone,
          user_type: 'provider',
          role: 'provider',
        },
      },
    })

    if (signUpError) {
      console.error('--- SIGNUP FAILURE ---', signUpError.message)
      return { error: signUpError.message }
    }

    const user = signUpData.user
    if (!user) return { error: 'Auth user creation failed' }

    // 2. Profiles Upsert
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: cleanFullName,
        phone: phone,
        user_type: 'provider',
        role: 'provider',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('--- PROFILE UPSERT FAILURE ---', profileError.message)
    }

    // 3. Service Providers Upsert
    const { error: providerError } = await supabase
      .from('service_providers')
      .upsert({
        user_id: user.id,
        business_name: business_name || 'Professional',
        bio: bio || null,
        phone: phone || null,
        location: location,
        years_exp: years_exp,
        service_offered: service_offered,
        skills: skills,
        pricing_info: pricing_info || null,
        payment_method: payment_method || null,
        payment_details: payment_details || null,
        onboarding_completed: true,
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })

    if (providerError) {
      console.error('--- PROVIDER UPSERT FAILURE ---', providerError.message)
      // Return the message string only, NOT the error object
      return { error: `Failed to save provider details: ${providerError.message}` }
    }

    console.log('--- Provider Onboarding Successful ---')
    revalidatePath('/', 'layout')
    
    return { 
      success: true, 
      hasSession: !!signUpData.session,
      message: !!signUpData.session ? 'Onboarding complete!' : 'Please check your email to confirm registration'
    }

  } catch (err: any) {
    console.error('--- UNEXPECTED SYSTEM ERROR ---', err)
    // Always return a clean error string
    return { error: err.message || 'An unexpected internal error occurred' }
  }
}
