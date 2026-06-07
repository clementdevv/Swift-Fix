'use server'

import { prisma } from '@/lib/prisma'
import { requireSession } from './_auth'

export async function getServiceCategories() {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { name: 'asc' },
  })

  return categories.map((c) => ({ id: c.id, name: c.name }))
}

export async function getProviderServices() {
  const session = await requireSession()

  const services = await prisma.providerService.findMany({
    where: { providerId: session.user.id },
    include: { serviceCategory: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return services.map((s) => ({
    id: s.id,
    provider_id: s.providerId,
    service_category_id: s.serviceCategoryId,
    title: s.title,
    description: s.description ?? '',
    price: s.price ?? '',
    active: s.active,
    category_name: s.serviceCategory?.name,
  }))
}

export async function createProviderService(data: {
  title: string
  description?: string
  price?: string
  service_category_id: string
  active?: boolean
}) {
  const session = await requireSession()

  await prisma.providerService.create({
    data: {
      providerId: session.user.id,
      title: data.title,
      description: data.description,
      price: data.price,
      serviceCategoryId: data.service_category_id,
      active: data.active ?? true,
    },
  })

  return { success: true }
}

export async function updateProviderService(
  id: string,
  data: {
    title?: string
    description?: string
    price?: string
    service_category_id?: string
    active?: boolean
  }
) {
  const session = await requireSession()

  const service = await prisma.providerService.findFirst({
    where: { id, providerId: session.user.id },
  })
  if (!service) throw new Error('Service not found')

  await prisma.providerService.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      serviceCategoryId: data.service_category_id,
      active: data.active,
    },
  })

  return { success: true }
}

export async function deleteProviderService(id: string) {
  const session = await requireSession()

  await prisma.providerService.deleteMany({
    where: { id, providerId: session.user.id },
  })

  return { success: true }
}

export async function toggleProviderServiceActive(id: string, active: boolean) {
  const session = await requireSession()

  await prisma.providerService.updateMany({
    where: { id, providerId: session.user.id },
    data: { active },
  })

  return { success: true }
}
