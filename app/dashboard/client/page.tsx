'use client'

import React, { useEffect, useState } from 'react';
import ActionCenter from '@/app/components/ActionCenter';
import ServiceDiscovery, { ServiceCategory } from '@/app/components/ServiceDiscovery';
import TransactionHistory, { Transaction } from '@/app/components/TransactionHistory';
import JobCard, { Job } from '@/app/components/JobCard';
import { ProtectedRoute } from '@/components/protected-route';
import DashboardLayout from '@/components/dashboard-layout';
import { clientNavigation } from '@/lib/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';

export default function ClientDashboard() {
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Active Bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          service_providers (business_name, pricing_info),
          service_categories (name)
        `)
        .eq('customer_id', user.id)
        .in('status', ['pending', 'upcoming', 'confirmed', 'in_progress'])
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // 2. Fetch Completed Bookings (Transaction History)
      const { data: completed, error: historyError } = await supabase
        .from('bookings')
        .select(`
          *,
          service_providers (business_name, pricing_info),
          service_categories (name)
        `)
        .eq('customer_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (historyError) throw historyError;

      // 3. Fetch Service Categories
      const { data: categories, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      // Map Data
      if (bookings) {
        setActiveJobs(bookings.map(b => ({
          id: b.id,
          serviceType: b.service_categories?.name || 'General Service',
          providerName: b.service_providers?.business_name || 'Professional',
          status: b.status as any,
          date: new Date(b.scheduled_date).toLocaleDateString()
        })));
      }

      if (completed) {
        setHistory(completed.map(b => ({
          id: b.id,
          date: new Date(b.created_at).toLocaleDateString(),
          service: b.service_categories?.name || 'Service',
          paymentStatus: 'Paid',
          amount: b.service_providers?.pricing_info || '$0'
        })));
      }

      if (categories) {
        setServices(categories.map(c => ({
          id: c.id,
          name: c.name,
          category: (['plumber', 'electrician', 'emergency'].includes(c.name.toLowerCase()) ? 'Emergency' : 'Routine') as any
        })));
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    router.push(`/find_services?q=${encodeURIComponent(query)}`);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout userType="customer" navigation={clientNavigation}>
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#3B82F6] opacity-20" />
            <p className="text-gray-400 font-medium animate-pulse">Building your experience...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const mainActiveJob = activeJobs[0];

  return (
    <ProtectedRoute>
      <DashboardLayout userType="customer" navigation={clientNavigation}>
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
          
          <ActionCenter 
            hasActiveBooking={activeJobs.length > 0} 
            activeBookingStatus={mainActiveJob?.status}
            onSearch={handleSearch}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg border border-blue-100">
                    <LayoutDashboard className="w-4 h-4 text-[#3B82F6]" />
                  </div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-widest text-xs">Active Service Status</h2>
                </div>
                
                {activeJobs.length > 0 ? (
                  <div className="grid gap-4">
                    {activeJobs.map(job => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                ) : (
                  <Card className="border-2 border-dashed border-gray-100 bg-white p-12 text-center group hover:border-blue-100 transition-all">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <LayoutDashboard className="w-8 h-8 text-gray-200" />
                    </div>
                    <h3 className="font-bold text-gray-900">No active jobs</h3>
                    <p className="text-sm text-gray-400 mt-1">Ready for something new? Explore our services below.</p>
                  </Card>
                )}
              </div>

              <ServiceDiscovery services={services} />
            </div>

            <div className="space-y-8">
              <TransactionHistory history={history} />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}