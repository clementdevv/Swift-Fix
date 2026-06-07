'use client'

import { useSession } from 'next-auth/react'

type UserRole = 'customer' | 'provider' | 'admin'

export function useUserRole() {
  const { data: session, status } = useSession()

  return {
    userRole: (session?.user?.userType as UserRole) ?? null,
    loading: status === 'loading',
    user: session?.user ?? null,
  }
}