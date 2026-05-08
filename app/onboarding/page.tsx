'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RoleBasedRoute from '@/app/components/role-based-route'
import { useUserRole } from '@/app/hooks/use-user-role'
import {
  Briefcase, MapPin, Phone, Mail, FileText, Camera, Upload,
  CheckCircle, ArrowRight, Zap, Droplet, Shield, Wind, Wrench, Users, Hammer, Lightbulb
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

const PROFESSIONAL_ROLES = [
  'Technician',
  'Senior Technician', 
  'Junior Engineer',
  'Engineer',
  'Senior Engineer',
  'Master Technician',
  'Specialist',
  'Expert',
  'Consultant',
  'Contractor'
]

const SERVICES = [
  { id: 'electrician', name: 'Electrician', icon: Zap },
  { id: 'plumber', name: 'Plumber', icon: Droplet },
  { id: 'cleaning', name: 'Cleaner', icon: Shield },
  { id: 'hvac', name: 'HVAC', icon: Wind },
  { id: 'painting', name: 'Painter', icon: Wrench },
  { id: 'pet handling', name: 'Pet Handler', icon: Users },
  { id: 'carpentry', name: 'Carpenter', icon: Hammer },
  { id: 'appliances', name: 'Appliance Repair', icon: Lightbulb }
]

export default function ProviderOnboarding() {
  const router = useRouter()
  const { userRole, user } = useUserRole()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    businessName: '',
    professionalRole: '',
    bio: '',
    phone: '',
    location: '',
    yearsExperience: '',
    pricingInfo: '',
    paymentMethod: '',
    paymentDetails: '',
    selectedServices: [] as string[],
    profileImage: null as File | null,
    portfolioImages: [] as File[]
  })

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      
      // Update provider profile
      const { error: updateError } = await supabase
        .from('service_providers')
        .update({
          business_name: formData.businessName,
          phone: formData.phone,
          service_offered: formData.selectedServices.join(', '),
          bio: formData.bio,
          skills: formData.selectedServices,
          pricing_info: formData.pricingInfo,
          payment_method: formData.paymentMethod,
          payment_details: formData.paymentDetails,
          onboarding_completed: true
        })
        .eq('user_id', user?.id)

      if (updateError) {
        throw updateError
      }

      // Handle profile image upload if provided
      if (formData.profileImage) {
        const fileExt = formData.profileImage.name.split('.').pop()
        const fileName = `${user?.id}-profile.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('provider-images')
          .upload(fileName, formData.profileImage)
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('provider-images')
            .getPublicUrl(fileName)
          
          await supabase
            .from('service_providers')
            .update({ profile_image: publicUrl })
            .eq('user_id', user?.id)
        }
      }

      router.push('/dashboard/service_provider')
    } catch (error) {
      console.error('Onboarding error:', error)
      setError('Failed to complete onboarding. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1) {
      if (!formData.businessName || !formData.bio || !formData.phone) {
        setError('Please fill in all required fields')
        return
      }
    }
    if (step === 2 && formData.selectedServices.length === 0) {
      setError('Please select at least one service')
      return
    }
    if (step === 3) {
      if (!formData.pricingInfo || !formData.paymentMethod || !formData.paymentDetails) {
        setError('Please fill in all pricing and payment information')
        return
      }
    }
    setError('')
    setStep(step + 1)
  }

  const prevStep = () => {
    setError('')
    setStep(step - 1)
  }

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Information</h2>
              <p className="text-gray-600">Tell us about your professional background</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your business name"
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio *
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Describe your experience, expertise, and what makes you a great service provider..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Services Offered</h2>
              <p className="text-gray-600">Select the services you provide</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SERVICES.map(service => (
                <button
                  key={service.id}
                  onClick={() => handleServiceToggle(service.id)}
                  className={`p-4 border rounded-lg transition-all ${
                    formData.selectedServices.includes(service.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <service.icon className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">{service.name}</p>
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Experience & Pricing</h2>
              <p className="text-gray-600">Set your experience and rates</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pricing Information *
                  </label>
                  <input
                    type="text"
                    value={formData.pricingInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricingInfo: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ksh. 700 per visit, price negotiable"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select payment method</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="till">Till Number</option>
                    <option value="pochi">Pochi la Biashara</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Details *
                  </label>
                  <input
                    type="text"
                    value={formData.paymentDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentDetails: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0712345678 or Till No: 123456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData(prev => ({ ...prev, profileImage: e.target.files?.[0] || null }))}
                    className="hidden"
                    id="profile-image"
                  />
                  <label htmlFor="profile-image" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700">Click to upload</span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <RoleBasedRoute allowedRoles={['provider']}>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step > stepNum ? <CheckCircle className="w-4 h-4" /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div
                      className={`w-full h-1 mx-4 ${
                        step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Professional Info</span>
              <span>Services</span>
              <span>Pricing & Payment</span>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit}>
              {getStepContent()}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={step === 1}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    step === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Previous
                </button>

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Complete Onboarding
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </RoleBasedRoute>
  )
}
