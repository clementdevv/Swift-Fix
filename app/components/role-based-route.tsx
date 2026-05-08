'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

type UserRole = 'customer' | 'provider' | 'admin'

interface RoleBasedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  redirectTo?: string
}

export default function RoleBasedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/login' 
}: RoleBasedRouteProps) {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkUserRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push(`${redirectTo}?redirectTo=${window.location.pathname}`)
          return
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single()

        if (error || !profile) {
          router.push(redirectTo)
          return
        }

        const userRole = profile.user_type as UserRole
        
        if (allowedRoles.includes(userRole)) {
          setAuthorized(true)
        } else {
          // Redirect to appropriate dashboard based on role
          if (userRole === 'admin') {
            router.push('/admin')
          } else if (userRole === 'provider') {
            router.push('/dashboard/service_provider')
          } else {
            router.push('/dashboard/customer')
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        router.push(redirectTo)
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [allowedRoles, redirectTo, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return null // Will redirect
  }

  return <>{children}</>
}
