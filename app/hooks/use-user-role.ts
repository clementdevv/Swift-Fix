'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type UserRole = 'customer' | 'provider' | 'admin'

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getUserRole() {
      try {
        // Get authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (!authUser) {
          setLoading(false)
          return
        }

        setUser(authUser)

        // Get user profile with role
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('user_type, full_name, email, phone')
          .eq('id', authUser.id)
          .single()

        if (error) {
          console.error('Error fetching user profile:', error)
        } else if (profile) {
          setUserRole(profile.user_type as UserRole)
        }
      } catch (error) {
        console.error('Error in useUserRole:', error)
      } finally {
        setLoading(false)
      }
    }

    getUserRole()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          
          // Refetch user role
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single()
          
          if (profile) {
            setUserRole(profile.user_type as UserRole)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUserRole(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return { userRole, loading, user }
}
