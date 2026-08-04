'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
  redirectTo = '/login',
}: RoleBasedRouteProps) {
  const { data: session, status } = useSession()
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push(`${redirectTo}?redirectTo=${window.location.pathname}`)
      return
    }

    const userRole = session.user.userType as UserRole

    if (allowedRoles.includes(userRole)) {
      setAuthorized(true)
    } else if (userRole === 'admin') {
      router.push('/admin')
    } else if (userRole === 'provider') {
      router.push('/dashboard/service_provider')
    } else {
      router.push('/dashboard/client')
    }
  }, [session, status, allowedRoles, redirectTo, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  return <>{children}</>
}
