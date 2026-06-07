'use client'

import React, { useEffect, useState } from 'react';
import ActionCenter from '@/app/components/ActionCenter';
import ServiceDiscovery, { ServiceCategory } from '@/app/components/ServiceDiscovery';
import TransactionHistory, { Transaction } from '@/app/components/TransactionHistory';
import JobCard, { Job } from '@/app/components/JobCard';
import { ProtectedRoute } from '@/components/protected-route';
import DashboardLayout from '@/components/dashboard-layout';
import { clientNavigation } from '@/lib/navigation';
import { getCustomerDashboardBookings } from '@/lib/actions/bookings';
import { getServiceCategories } from '@/lib/actions/services';
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

      const [bookings, categories] = await Promise.all([
        getCustomerDashboardBookings(),
        getServiceCategories(),
      ]);

      setActiveJobs(
        bookings.active.map((j) => ({
          id: j.id,
          serviceType: j.serviceType,
          providerName: j.providerName,
          status: j.status as Job['status'],
          date: j.date,
        }))
      );

      setHistory(
        bookings.completed.map((j) => ({
          id: j.id,
          date: j.date,
          service: j.service,
          paymentStatus: j.paymentStatus,
          amount: j.amount,
        }))
      );

      setServices(
        categories.slice(0, 10).map((s) => ({
          id: s.id,
          name: s.name,
          category: 'Routine' as const,
        }))
      );
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