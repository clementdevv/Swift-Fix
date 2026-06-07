'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

function ResetPasswordForm() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3B82F6] rounded-full mb-3 shadow-md shadow-[#3B82F6]/20">
            <span className="text-white tracking-wider font-bold text-lg">BQ</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Briqoly</h1>
          <p className="text-xs font-normal text-gray-500 mt-1">Service Provider Platform</p>
        </div>

        <Card className="overflow-hidden border-0 shadow-[0_10px_25px_rgba(0,0,0,0.08)]" style={{ borderRadius: '12px' }}>
          <div className="p-8 bg-white">
            <div className="mb-8">
              <h2 className="text-[22px] font-semibold text-gray-900">Reset Password</h2>
              <p className="text-sm font-normal text-gray-500 mt-2">
                Password reset via email is not yet configured.
              </p>
            </div>

            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Use the forgot-password flow to request a reset link once email delivery is set up, or contact
                support if you need immediate access.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button
                asChild
                className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-2.5 rounded-lg transition-colors"
              >
                <Link href="/forgot-password">Request reset link</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full font-medium py-2.5 rounded-lg transition-colors"
              >
                <Link href="/login">Back to login</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-4 h-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
