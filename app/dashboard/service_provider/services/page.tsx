'use client'

import React, { useState, useEffect } from 'react'
import {
  getServiceCategories,
  getProviderServices,
  createProviderService,
  updateProviderService,
  deleteProviderService,
  toggleProviderServiceActive,
} from '@/lib/actions/services'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Plus, Edit2, Trash2, X, Check, Loader2, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import ModalOverlay from '@/components/modal-overlay'


// DB interface
interface ProviderService {
  id: string;
  provider_id: string;
  service_category_id: string | null;
  title: string;
  description: string;
  price: string;
  active: boolean;
  category_name?: string;
}

export default function MyServicesPage() {
  const [services, setServices] = useState<ProviderService[]>([])
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    service_category_id: '',
    active: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [catData, srvData] = await Promise.all([
        getServiceCategories(),
        getProviderServices(),
      ])
      setCategories(catData)
      setServices(srvData)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load services.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({
      title: '',
      description: '',
      price: '',
      service_category_id: categories.length > 0 ? categories[0].id : '',
      active: true
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (service: ProviderService) => {
    setEditingId(service.id)
    setFormData({
      title: service.title,
      description: service.description || '',
      price: service.price || '',
      service_category_id: service.service_category_id || (categories.length > 0 ? categories[0].id : ''),
      active: service.active
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    try {
      await deleteProviderService(id)
      setServices(prev => prev.filter(s => s.id !== id))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete service.')
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await toggleProviderServiceActive(id, !currentActive)
      setServices(prev => prev.map(s => s.id === id ? { ...s, active: !currentActive } : s))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update service.')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    
    try {
      if (editingId) {
        await updateProviderService(editingId, {
          title: formData.title,
          description: formData.description,
          price: formData.price,
          service_category_id: formData.service_category_id,
          active: formData.active,
        })
      } else {
        await createProviderService({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          service_category_id: formData.service_category_id,
          active: formData.active,
        })
      }

      setIsModalOpen(false)
      fetchData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save service.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Services</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage the custom services and pricing you offer to clients.</p>
        </div>
        <Button onClick={handleOpenAdd} className="bg-orange-500 hover:bg-orange-600 font-bold text-white shadow-sm border-0">
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </div>

      {error && !isModalOpen && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-4 mt-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
           <Loader2 className="w-8 h-8 animate-spin text-orange-500 opacity-30 mb-3" />
           <p className="text-sm text-slate-400 font-medium animate-pulse">Loading your configured services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <Settings className="w-8 h-8 text-orange-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No custom services</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">You haven't defined any specific services yet. Create one to show exact pricing and descriptions to clients.</p>
          <Button onClick={handleOpenAdd} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
            <Plus className="w-4 h-4 mr-2" /> Create First Service
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {services.map((service) => (
            <Card key={service.id} className="relative group overflow-hidden border border-slate-200 transition-all hover:border-orange-200 hover:shadow-lg hover:-translate-y-1">
              <div className={`absolute top-0 left-0 w-full h-1.5 ${service.active ? 'bg-orange-500' : 'bg-slate-300'}`} />
              <CardHeader className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs font-semibold">
                    {service.category_name || 'Uncategorized'}
                  </Badge>
                  <button 
                    onClick={() => handleToggleActive(service.id, service.active)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors ${service.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {service.active ? '● Active' : '○ Paused'}
                  </button>
                </div>
                <CardTitle className="text-xl pr-6 font-bold text-slate-900 leading-tight mb-2">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-slate-600 h-10 line-clamp-2">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black mb-6 text-slate-900">
                  {service.price}
                </div>
                
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <Button onClick={() => handleOpenEdit(service)} variant="outline" size="sm" className="flex-1 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold">
                    <Edit2 className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    Edit
                  </Button>
                  <Button onClick={() => handleDelete(service.id)} variant="outline" size="sm" className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100 font-bold">
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Slide-over or Modal for Add/Edit */}
      <ModalOverlay
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ariaLabelledBy="service-modal-title"
      >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 id="service-modal-title" className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Service Category</label>
                <select 
                  required
                  value={formData.service_category_id}
                  onChange={e => setFormData(p => ({...p, service_category_id: e.target.value}))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-medium"
                >
                  <option value="" disabled>Select a category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Service Title</label>
                <Input 
                  required
                  placeholder="e.g. Premium Water Heater Installation" 
                  value={formData.title}
                  onChange={e => setFormData(p => ({...p, title: e.target.value}))}
                  className="font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Description</label>
                <textarea 
                  required
                  placeholder="Describe what is exactly included in this service..." 
                  value={formData.description}
                  onChange={e => setFormData(p => ({...p, description: e.target.value}))}
                  rows={3}
                  className="resize-none font-medium text-sm flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Pricing Details</label>
                <Input 
                  required
                  placeholder="e.g. From $150 or Fixed $200" 
                  value={formData.price}
                  onChange={e => setFormData(p => ({...p, price: e.target.value}))}
                  className="font-medium"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="active-toggle"
                  checked={formData.active}
                  onChange={e => setFormData(p => ({...p, active: e.target.checked}))}
                  className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="active-toggle" className="text-sm font-semibold text-slate-800 cursor-pointer">
                  Service is currently active and bookable
                </label>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 font-bold">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold">
                  {saving ? 'Saving...' : (editingId ? 'Save Changes' : 'Create Service')}
                </Button>
              </div>
            </form>
          </div>
      </ModalOverlay>
    </div>
  )
}
