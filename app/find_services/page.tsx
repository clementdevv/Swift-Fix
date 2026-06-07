'use client'

import { useState, useMemo, useEffect } from 'react'
import { getOnboardedProviders } from '@/lib/actions/providers'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/protected-route'
import DashboardLayout from '@/components/dashboard-layout'
import { clientNavigation } from '@/lib/navigation'
import {
  Search, MapPin, Star, Clock, CheckCircle, Filter,
  Droplet, Zap, Hammer, Wind, Shield, Wrench as Wrench2,
  Lightbulb, Wrench, Users, RotateCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import BookingModal from '@/components/booking-modal'

// IDs must exactly match service_categories.name in the database
const SERVICES = [
  { id: 'all',         name: 'All Services',  icon: null },
  { id: 'plumber',     name: 'Plumbing',      icon: Droplet },
  { id: 'electrician', name: 'Electrical',    icon: Zap },
  { id: 'carpentry',   name: 'Carpentry',     icon: Hammer },
  { id: 'hvac',        name: 'HVAC',          icon: Wind },
  { id: 'roofing',     name: 'Roofing',       icon: Shield },
  { id: 'painting',    name: 'Painting',      icon: Wrench2 },
  { id: 'cleaning',    name: 'Cleaning',      icon: Lightbulb },
  { id: 'pet handling',name: 'Pet Handling',  icon: Users },
  { id: 'carpentry',   name: 'Carpentry',     icon: Hammer },
].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i) // dedupe



export default function FindServicesPage() {
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  
  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{id: string, name: string, category: string} | null>(null)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const data = await getOnboardedProviders()

      if (data) {
        const mappedData = data.map((p: any) => {
          // Ensure services is always an array, even if the DB returns null or a string
          let skillsArray: string[] = [];
          
          if (Array.isArray(p.skills)) {
            skillsArray = p.skills;
            } else if (typeof p.skills === 'string') {
              // This handles the {a,b,c} or ["a","b"] strings if the column wasn't converted
              skillsArray = p.skills.replace(/[{}"[\]]/g, '').split(',').map((s: string) => s.trim().toLowerCase());
            }

          return {
            id: p.user_id,
            name: p.business_name || p.profiles?.full_name || 'Anonymous Pro',
            // Add the main service category to the array so it always matches the category filter
            services: [p.service_offered?.toLowerCase(), ...skillsArray]
              .flatMap((s: string | undefined) => s ? s.split(',').map(item => item.trim().toLowerCase()) : [])
              .filter(Boolean),
            rating: 5.0,
            reviewCount: 0,
            location: 'Local',
            distance: 'Nearby',
            responseTime: 'Fast',
            verified: true,
            hourlyRate: p.pricing_info || 'Price on request',
            description: p.bio || 'Professional service provider.',
            avatar: (p.business_name || p.profiles?.full_name || 'A')[0].toUpperCase(),
            completedJobs: 0,
            yearsExperience: p.years_exp || 0
          }
        })
        setProviders(mappedData)
      }
    } catch (err) {
      console.error('Error fetching providers:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProviders = useMemo(() => {
    let filtered = providers

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((provider: any) =>
        provider.services.includes(selectedCategory)
      )
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((provider: any) =>
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.services.some((service: string) =>
          SERVICES.find(s => s.id === service)?.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Sort providers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'distance':
          return parseFloat(a.distance) - parseFloat(b.distance)
        case 'price':
          return parseFloat(a.hourlyRate.replace(/[^0-9.]/g, '')) - parseFloat(b.hourlyRate.replace(/[^0-9.]/g, ''))
        default:
          return 0
      }
    })

    return filtered
  }, [selectedCategory, searchQuery, sortBy])

  const getServiceIcon = (serviceId: string) => {
    const service = SERVICES.find(s => s.id === serviceId)
    return service?.icon || Wrench
  }

  const getServiceName = (serviceId: string) => {
    const service = SERVICES.find(s => s.id === serviceId)
    return service?.name || 'Unknown Service'
  }

  const handleBookService = (e: React.MouseEvent, provider: any) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('👇 Booking button clicked for provider:', {
      id: provider.id,
      name: provider.name,
      services: provider.services
    })
    // Determine the category to pass to the modal
    // If a category is selected (and not 'all'), use it. 
    // Otherwise, use the first service the provider offers if it matches our SERVICES list.
    let category = selectedCategory
    if (category === 'all' && provider.services.length > 0) {
      category = provider.services[0]
    }
    
    setSelectedProvider({
      id: provider.id,
      name: provider.name,
      category: category
    })
    setIsBookingModalOpen(true)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout userType="customer" navigation={clientNavigation}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Find Services</h1>
                <p className="text-gray-600">Browse and connect with verified service providers</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProviders}
                disabled={loading}
                className="flex items-center gap-2 text-gray-600 hover:text-[#3B82F6] hover:border-[#3B82F6]"
              >
                <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh Listings</span>
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search providers, services, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]"
                >
                  <option value="rating">Sort by Rating</option>
                  <option value="distance">Sort by Distance</option>
                  <option value="price">Sort by Price</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter by Category</h2>
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((service) => {
                const Icon = service.icon
                const isSelected = selectedCategory === service.id
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedCategory(service.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                      isSelected
                        ? 'border-[#3B82F6] bg-[#EFF6FF] text-[#2563EB]'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-[#93C5FD] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span className="text-sm font-medium">{service.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredProviders.length === 0 ? 'No' : filteredProviders.length} Provider{filteredProviders.length !== 1 ? 's' : ''} Found
              </h2>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 p-6 h-64">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="mt-6 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No providers found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or category filter</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProviders.map((provider: any) => (
                  <Link
                    key={provider.id}
                    href={`/provider/${provider.id}`}
                    className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-[#93C5FD] transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {provider.avatar}
                      </div>

                      {/* Provider Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 group-hover:text-[#3B82F6] transition-colors">
                              {provider.name}
                            </h3>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium text-gray-900">{provider.rating}</span>
                              <span className="text-sm text-gray-500">({provider.reviewCount})</span>
                              {provider.verified && (
                                <CheckCircle className="w-4 h-4 text-green-500 ml-1" />
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#3B82F6]">{provider.hourlyRate}</div>
                            <div className="text-xs text-gray-500">per hour</div>
                          </div>
                        </div>

                        {/* Services */}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {provider.services.slice(0, 2).map((serviceId: string) => {
                            const Icon = getServiceIcon(serviceId)
                            return (
                              <div
                                key={serviceId}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                              >
                                <Icon className="w-3 h-3" />
                                <span>{getServiceName(serviceId)}</span>
                              </div>
                            )
                          })}
                          {provider.services.length > 2 && (
                            <div className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                              +{provider.services.length - 2} more
                            </div>
                          )}
                        </div>

                        {/* Location & Response Time */}
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{provider.distance}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{provider.responseTime}</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {provider.description}
                        </p>

                        {/* Stats */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{provider.completedJobs} jobs completed</span>
                            <span>{provider.yearsExperience} years experience</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => handleBookService(e, provider)}
                            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs px-4 py-1.5 h-auto rounded-lg shadow-sm"
                          >
                            Book Service
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking Modal */}
        {selectedProvider && (
          <BookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            providerId={selectedProvider.id}
            providerName={selectedProvider.name}
            categoryName={selectedProvider.category !== 'all' ? selectedProvider.category : 'General Services'}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
