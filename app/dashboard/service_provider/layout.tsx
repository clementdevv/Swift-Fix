'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/protected-route'
import DashboardLayout from '@/components/dashboard-layout'
import { providerNavigation } from '@/lib/navigation'

export default function ServiceProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout userType="provider" navigation={providerNavigation}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
