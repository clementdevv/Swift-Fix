
// app/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary/10 to-primary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-primary hover:text-primary mb-6 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <Card className="animate-fade-in overflow-hidden border-2 border-primary/20 shadow-2xl">
          <div className="p-8 bg-gradient-to-b from-white to-primary/10">
            {!isSubmitted ? (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Forgot password?</h2>
                  <p className="text-primary font-medium mt-2 text-sm">
                    No worries! Enter your email and we'll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-2 border-primary/30 focus:border-primary focus:ring-primary"
                      placeholder="david@mylocalpro.com"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:brightness-90 text-white font-bold transform hover:scale-105 transition-all shadow-lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
                <p className="text-gray-700 font-medium mt-2 text-sm">
                  We've sent a password reset link to <br />
                  <strong className="text-primary">{email}</strong>
                </p>
                <Link
                  href="/login"
                  className="inline-block w-full mt-6 bg-primary/90 text-white py-3 rounded-lg font-bold hover:brightness-90 transition-all text-center shadow-lg"
                >
                  Return to Login
                </Link>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-4 text-sm text-primary hover:text-primary transition-colors font-medium"
                >
                  Didn't receive the email? Try again
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}