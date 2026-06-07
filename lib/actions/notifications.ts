'use server'

import { prisma } from '@/lib/prisma'
import { requireSession } from './_auth'

function toNotificationItem(n: {
  id: string
  title: string
  message: string
  read: boolean
  type: string
  bookingId: string | null
  createdAt: Date
}) {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    read: n.read,
    type: n.type,
    booking_id: n.bookingId ?? undefined,
    created_at: n.createdAt.toISOString(),
  }
}

export async function getRecentNotifications(limit = 5) {
  const session = await requireSession()

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return notifications.map(toNotificationItem)
}

export async function getNotifications() {
  const session = await requireSession()

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return notifications.map(toNotificationItem)
}

export async function markNotificationRead(id: string) {
  const session = await requireSession()

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  })

  return { success: true }
}

export async function markAllNotificationsRead() {
  const session = await requireSession()

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  })

  return { success: true }
}

export async function deleteNotification(id: string) {
  const session = await requireSession()

  await prisma.notification.deleteMany({
    where: { id, userId: session.user.id },
  })

  return { success: true }
}
