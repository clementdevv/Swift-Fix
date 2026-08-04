'use server'

import { prisma } from '@/lib/prisma'
import { requireSession } from './_auth'

export async function createReview(input: {
  bookingId: string
  revieweeId: string
  rating: number
  comment?: string
}) {
  const session = await requireSession()

  const booking = await prisma.booking.findFirst({
    where: {
      id: input.bookingId,
      customerId: session.user.id,
      providerId: input.revieweeId,
    },
  })
  if (!booking) throw new Error('Booking not found')

  const existing = await prisma.review.findFirst({
    where: { bookingId: input.bookingId, reviewerId: session.user.id },
  })
  if (existing) throw new Error('You have already reviewed this booking')

  await prisma.review.create({
    data: {
      bookingId: input.bookingId,
      reviewerId: session.user.id,
      revieweeId: input.revieweeId,
      rating: input.rating,
      comment: input.comment,
    },
  })

  return { success: true }
}

export async function getReviews() {
  const reviews = await prisma.review.findMany({
    include: {
      booking: { include: { category: { select: { name: true } } } },
      reviewer: { select: { fullName: true } },
      reviewee: { select: { fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment ?? '',
    date: r.createdAt.toISOString(),
    helpful: r.helpfulVotes,
    reviewerName: r.reviewer.fullName ?? 'User',
    reviewerAvatar: r.reviewer.fullName?.substring(0, 2).toUpperCase() ?? 'U',
    revieweeName: r.reviewee.fullName ?? 'Provider',
    revieweeAvatar: r.reviewee.fullName?.substring(0, 2).toUpperCase() ?? 'P',
    serviceType: r.booking.category.name,
    jobTitle: `${r.booking.category.name} Job`,
  }))
}

export async function getProviderReviews() {
  const session = await requireSession()

  const reviews = await prisma.review.findMany({
    where: { revieweeId: session.user.id },
    include: {
      reviewer: { select: { fullName: true } },
      booking: { include: { category: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.createdAt.toISOString(),
    helpful_votes: r.helpfulVotes,
    profiles: { full_name: r.reviewer.fullName },
    bookings: {
      service_categories: { name: r.booking.category.name },
    },
  }))
}

export async function voteReviewHelpful(id: string) {
  const review = await prisma.review.findUnique({ where: { id } })
  if (!review) throw new Error('Review not found')

  await prisma.review.update({
    where: { id },
    data: { helpfulVotes: review.helpfulVotes + 1 },
  })

  return { helpful: review.helpfulVotes + 1 }
}
