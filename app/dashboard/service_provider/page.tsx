'use client'

import React, { useEffect, useState } from 'react';
import StatsCards from '@/app/components/StatsCards';
import ServiceOrder, { OrderItem } from '@/app/components/ServiceOrder';
import RecentActivity from '@/app/components/RecentActivity';
import TransactionHistory, { Transaction } from '@/app/components/TransactionHistory';
import { createClient } from '@/utils/supabase/client';
import { DollarSign, Wrench, CheckCircle, Clock, FileText, LucideIcon, Loader2 } from 'lucide-react';

export default function ServiceProviderDashboard() {
  const [stats, setStats] = useState<any[] | undefined>(undefined);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch All Jobs for this provider
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:profiles!jobs_client_id_fkey (full_name),
          service:services (name, price)
        `)
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (jobs) {
        const bookings = jobs; // Keep the 'bookings' variable name to minimize further changes
        // --- Calculate Stats ---
        const completed = bookings.filter(b => b.status === 'completed');
        const active = bookings.filter(b => ['accepted', 'in_progress'].includes(b.status));
        const pending = bookings.filter(b => b.status === 'pending');
        
        const totalRevenue = completed.reduce((acc, curr) => {
          const price = parseFloat(String(curr.price || (curr.service as any)?.price || '0').replace(/[^0-9.]/g, ''));
          return acc + price;
        }, 0);

        setStats([
          {
            title: 'Total Revenue',
            value: `$${totalRevenue.toLocaleString()}`,
            change: '+0%', // Placeholder for now
            icon: DollarSign,
            color: 'bg-green-50 text-green-600',
          },
          {
            title: 'Active Orders',
            value: active.length.toString(),
            change: '+0',
            icon: Wrench,
            color: 'bg-blue-50 text-blue-600',
          },
          {
            title: 'Completed',
            value: completed.length.toString(),
            change: '+0',
            icon: CheckCircle,
            color: 'bg-purple-50 text-purple-600',
          },
          {
            title: 'Pending',
            value: pending.length.toString(),
            change: '+0',
            icon: Clock,
            color: 'bg-amber-50 text-amber-600',
          },
        ]);

        // --- Map Recent Orders ---
        const mappedOrders: OrderItem[] = bookings.slice(0, 5).map(b => ({
          id: b.id,
          title: (b.service as any)?.name || b.title || 'General Service',
          amount: b.price ? `$${b.price}` : ((b.service as any)?.price ? `$${(b.service as any).price}` : 'Quoted'),
          status: b.status as any,
          date: b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'
        }));
        setOrders(mappedOrders);

        // --- Map Recent Activity ---
        const mappedActivities = bookings.slice(0, 5).map(b => ({
          id: b.id,
          type: 'order',
          title: b.status === 'pending' ? 'New booking request' : `Booking ${b.status}`,
          description: `${(b.service as any)?.name || 'Service'} for ${(b.customer as any)?.full_name || 'Client'}`,
          time: new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          icon: b.status === 'completed' ? CheckCircle : FileText,
          color: b.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600',
        }));
        setActivities(mappedActivities);

        // --- Map Transaction History (Completed Bookings) ---
        const mappedHistory: Transaction[] = completed.slice(0, 5).map(b => ({
          id: b.id,
          date: b.scheduled_at ? new Date(b.scheduled_at).toLocaleDateString() : new Date(b.created_at).toLocaleDateString(),
          service: (b.service as any)?.name || b.title || 'Service',
          paymentStatus: 'Paid',
          amount: b.price ? `$${b.price}` : ((b.service as any)?.price ? `$${(b.service as any).price}` : '$0')
        }));
        setHistory(mappedHistory);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#3B82F6] opacity-20" />
        <p className="text-gray-400 font-medium animate-pulse">Syncing your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1 font-medium italic">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-[#3B82F6] bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
          <div className="w-2 h-2 bg-[#3B82F6] rounded-full animate-ping" />
          Live Status: Operational
        </div>
      </div>

      <StatsCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ServiceOrder orders={orders} />
        </div>
        <div>
          <RecentActivity activities={activities} />
        </div>
      </div>

      <TransactionHistory history={history} />
    </div>
  );
}
