// app/signup/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Wrench,
  User, Briefcase, CheckCircle, XCircle, Users
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signup } from '@/app/auth/actions'

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0: Choose role, 1: Fill form
  const [userType, setUserType] = useState<'provider' | 'customer' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [registerError, setRegisterError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  })

  const checkPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[a-z]+/)) strength++
    if (password.match(/[A-Z]+/)) strength++
    if (password.match(/[0-9]+/)) strength++
    if (password.match(/[$@#&!]+/)) strength++
    return strength
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setFormData({ ...formData, password: newPassword })
    setPasswordStrength(checkPasswordStrength(newPassword))
  }

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-600'
    if (passwordStrength <= 3) return 'bg-amber-500'
    return 'bg-[#3B82F6]'
  }

  const getStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength <= 3) return 'Medium'
    return 'Strong'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError(null)

    if (formData.password !== formData.confirmPassword) {
      setRegisterError("Passwords don't match")
      return
    }

    if (!formData.agreeTerms) {
      setRegisterError('Please agree to the terms and conditions')
      return
    }

    setIsLoading(true)

    try {
      if (userType === 'provider') {
        // Delay account creation for providers until onboarding is complete
        const pendingData = {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName
        }
        sessionStorage.setItem('_pending_provider_signup', JSON.stringify(pendingData))
        router.push('/onboarding/provider')
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append('email', formData.email)
      formDataToSend.append('password', formData.password)
      formDataToSend.append('full_name', formData.fullName)
      // Customer role
      formDataToSend.append('user_type', 'customer')

      const result = await signup(formDataToSend)

      if (result?.error) {
        setRegisterError(result.error)
      } else if (result?.success) {
        router.push('/login?message=Account created. Please sign in.')
      } else {
        setRegisterError('Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setRegisterError('An error occurred during registration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleSelect = (role: 'provider' | 'customer') => {
    setUserType(role)
    setStep(1)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3B82F6] rounded-full mb-3 shadow-md shadow-[#3B82F6]/20">
            <span className="text-white tracking-wider font-bold text-lg">BQ</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Briqoly</h1>
          <p className="text-xs font-normal text-gray-500 mt-1">Service Provider Platform</p>
        </div>

        {/* Main Card */}
        <Card className="overflow-hidden border-0 shadow-[0_10px_25px_rgba(0,0,0,0.08)]" style={{ borderRadius: '12px' }}>
          {step === 0 ? (
            // STEP 1: Choose Role
            <div className="p-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">How would you like to join?</h2>
                <p className="text-sm text-gray-500">Choose your role to get started</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Service Provider Option */}
                <button
                  onClick={() => handleRoleSelect('provider')}
                  className="p-6 border border-gray-200 rounded-xl hover:border-[#93C5FD] hover:bg-[#EFF6FF] transition-all duration-300 text-left group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-4 w-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#60A5FA] to-[#3B82F6] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Service Provider</h3>
                    <p className="text-[#2563EB] text-sm mb-4 font-medium">Offer your services and grow your business</p>
                    <ul className="space-y-2 text-xs text-gray-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#3B82F6] flex-shrink-0 font-bold" />
                        Professional profile
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#3B82F6] flex-shrink-0 font-bold" />
                        Take on jobs & earn
                      </li>
                    </ul>
                  </div>
                </button>

                {/* Client Option */}
                <button
                  onClick={() => handleRoleSelect('customer')}
                  className="p-6 border border-gray-200 rounded-xl hover:border-[#93C5FD] hover:bg-[#EFF6FF] transition-all duration-300 text-left group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-4 w-full">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#60A5FA] to-[#3B82F6] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Client</h3>
                    <p className="text-[#2563EB] text-sm mb-4 font-medium">Find and hire service professionals</p>
                    <ul className="space-y-2 text-xs text-gray-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#3B82F6] flex-shrink-0 font-bold" />
                        Browse service providers
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#3B82F6] flex-shrink-0 font-bold" />
                        Easy booking & payment
                      </li>
                    </ul>
                  </div>
                </button>
              </div>

              <p className="text-center text-sm text-gray-600 mt-8">
                Already have an account?{' '}
                <Link href="/login" className="text-[#3B82F6] hover:text-[#2563EB] font-bold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          ) : (
            // STEP 2: Registration Form
            <div className="p-8 bg-white">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {userType === 'provider' ? 'Create Provider Account' : 'Complete Your Profile'}
                  </h2>
                  <p className="text-[#3B82F6] font-medium text-sm mt-1">
                    Tell us about yourself
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  aria-label="Go back to role selection"
                  className="text-gray-400 hover:text-[#3B82F6] transition-colors text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              {registerError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                  {registerError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#3B82F6]" />
                    <Input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full border border-gray-300 bg-gray-50 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-500 transition-all focus:outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/20"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#3B82F6]" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 bg-gray-50 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder:text-gray-500 transition-all focus:outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/20"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#3B82F6]" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handlePasswordChange}
                      className="w-full border border-gray-300 bg-gray-50 rounded-lg pl-10 pr-10 py-2.5 text-gray-900 placeholder:text-gray-500 transition-all focus:outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/20"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#3B82F6] hover:text-[#2563EB] transition-colors font-bold"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        <div className={`h-2 flex-1 rounded-full ${passwordStrength >= 1 ? getStrengthColor() : 'bg-gray-200'}`} />
                        <div className={`h-2 flex-1 rounded-full ${passwordStrength >= 2 ? getStrengthColor() : 'bg-gray-200'}`} />
                        <div className={`h-2 flex-1 rounded-full ${passwordStrength >= 3 ? getStrengthColor() : 'bg-gray-200'}`} />
                        <div className={`h-2 flex-1 rounded-full ${passwordStrength >= 4 ? getStrengthColor() : 'bg-gray-200'}`} />
                        <div className={`h-2 flex-1 rounded-full ${passwordStrength >= 5 ? getStrengthColor() : 'bg-gray-200'}`} />
                      </div>
                      <p className={`text-xs font-bold ${passwordStrength <= 2 ? 'text-red-600' : passwordStrength <= 3 ? 'text-amber-600' : 'text-[#3B82F6]'}`}>
                        Password strength: {getStrengthText()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#3B82F6]" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full border border-gray-300 bg-gray-50 rounded-lg pl-10 pr-10 py-2.5 text-gray-900 placeholder:text-gray-500 transition-all focus:outline-none focus:border-[#3B82F6] focus:ring-3 focus:ring-[#3B82F6]/20"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#3B82F6] hover:text-[#2563EB] transition-colors font-bold"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      Passwords do not match
                    </p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                    <p className="mt-1 text-xs text-[#3B82F6] font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Passwords match
                    </p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <label className="flex items-start gap-2 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                    className="w-4 h-4 rounded border-2 border-[#93C5FD] bg-white cursor-pointer accent-[#3B82F6] mt-0.5"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    I agree to the{' '}
                    <Link href="/terms" className="text-[#3B82F6] hover:text-[#2563EB] font-bold transition-colors">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-[#3B82F6] hover:text-[#2563EB] font-bold transition-colors">
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-2.5 rounded-lg transition-colors mt-6"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {userType === 'provider' ? 'Creating account...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      {userType === 'provider' ? 'Proceed to Onboarding' : 'Create Client Account'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-gray-600 mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-[#3B82F6] hover:text-[#2563EB] font-bold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

