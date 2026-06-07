'use server'

import { prisma } from '@/lib/prisma'
import { requireSession } from './_auth'

function toUiStatus(status: string) {
  return status.toLowerCase() as
    | 'pending'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
}

function toDbStatus(status: string) {
  return status.toUpperCase() as
    | 'PENDING'
    | 'CONFIRMED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
}

export async function createBooking(input: {
  providerId: string
  categoryName: string
  scheduledDate: string
  scheduledTime: string
  serviceDescription: string
}) {
  const session = await requireSession()

  const category = await prisma.serviceCategory.findFirst({
    where: { name: { equals: input.categoryName, mode: 'insensitive' } },
  })
  if (!category) throw new Error(`Invalid service category: ${input.categoryName}`)

  await prisma.booking.create({
    data: {
      customerId: session.user.id,
      providerId: input.providerId,
      categoryId: category.id,
      scheduledDate: new Date(input.scheduledDate + 'T00:00:00'),
      scheduledTime: input.scheduledTime,
      serviceDescription: input.serviceDescription,
      status: 'PENDING',
    },
  })

  return { success: true }
}

export async function getCustomerBookings() {
  const session = await requireSession()

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.user.id },
    include: {
      provider: { select: { fullName: true } },
      category: { select: { name: true } },
      reviews: { select: { id: true } },
    },
    orderBy: { scheduledDate: 'desc' },
  })

  return bookings.map((b) => ({
    id: b.id,
    providerId: b.providerId,
    providerName: b.provider.fullName ?? 'Professional',
    service: b.category.name,
    status: toUiStatus(b.status),
    scheduledDate: b.scheduledDate.toISOString().split('T')[0],
    scheduledTime: b.scheduledTime,
    notes: b.serviceDescription,
    reviewed: b.reviews.length > 0,
  }))
}

export async function getBookingById(id: string) {
  const session = await requireSession()

  const booking = await prisma.booking.findFirst({
    where: { id, customerId: session.user.id },
    include: {
      category: { select: { name: true } },
      provider: { include: { providerProfile: true } },
      reviews: { select: { id: true } },
    },
  })

  if (!booking) return null

  const providerProfile = booking.provider.providerProfile
  const providerName =
    providerProfile?.businessName ?? booking.provider.fullName ?? 'Service Professional'

  return {
    id: booking.id,
    provider_id: booking.providerId,
    providerName,
    providerAvatar: providerName[0]?.toUpperCase() ?? 'S',
    providerRating: 5.0,
    service: booking.category.name,
    serviceId: booking.category.name.toLowerCase(),
    status: toUiStatus(booking.status),
    scheduledDate: booking.scheduledDate.toISOString().split('T')[0],
    scheduledTime: booking.scheduledTime,
    location: 'On-site / Remote',
    estimatedDuration: 'Flexible',
    estimatedCost: providerProfile?.pricingInfo ?? 'To be quoted',
    notes: booking.serviceDescription,
    reviewed: booking.reviews.length > 0,
    createdAt: booking.createdAt.toISOString(),
  }
}

export async function getProviderBookings() {
  const session = await requireSession()

  const bookings = await prisma.booking.findMany({
    where: { providerId: session.user.id },
    include: {
      customer: { select: { fullName: true, phone: true } },
      category: { select: { name: true } },
      provider: {
        include: {
          providerProfile: { select: { pricingInfo: true, businessName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return bookings.map((b) => ({
    id: b.id,
    customer_id: b.customerId,
    provider_id: b.providerId,
    status: toUiStatus(b.status),
    scheduled_date: b.scheduledDate.toISOString().split('T')[0],
    scheduled_time: b.scheduledTime,
    service_description: b.serviceDescription,
    location: null as string | null,
    created_at: b.createdAt.toISOString(),
    profiles: {
      full_name: b.customer.fullName,
      phone: b.customer.phone,
    },
    service_categories: { name: b.category.name },
    service_providers: {
      pricing_info: b.provider.providerProfile?.pricingInfo,
      business_name: b.provider.providerProfile?.businessName,
    },
  }))
}

export async function updateBookingStatus(
  id: string,
  status: 'confirmed' | 'cancelled' | 'completed' | 'in_progress' | 'pending'
) {
  const session = await requireSession()

  const booking = await prisma.booking.findFirst({
    where: { id, providerId: session.user.id },
  })
  if (!booking) throw new Error('Booking not found')

  await prisma.booking.update({
    where: { id },
    data: { status: toDbStatus(status) },
  })

  return { success: true }
}

export async function getCustomerDashboardBookings() {
  const session = await requireSession()

  const bookings = await prisma.booking.findMany({
    where: { customerId: session.user.id },
    include: {
      provider: { select: { fullName: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const activeStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] as const

  const active = bookings
    .filter((b) => activeStatuses.includes(b.status as (typeof activeStatuses)[number]))
    .map((b) => ({
      id: b.id,
      serviceType: b.category.name,
      providerName: b.provider.fullName ?? 'Professional',
      status: toUiStatus(b.status),
      date: b.scheduledDate.toLocaleDateString(),
    }))

  const completed = bookings
    .filter((b) => b.status === 'COMPLETED')
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      date: b.scheduledDate.toLocaleDateString(),
      service: b.category.name,
      paymentStatus: 'Paid' as const,
      amount: 'TBD',
    }))

  return { active, completed }
}
