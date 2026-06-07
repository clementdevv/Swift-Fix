
import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! })
const prisma = new PrismaClient({ adapter })

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'HVAC',
  'Roofing',
  'Painting',
  'Cleaning',
  'Pet Handling',
]

async function main() {
  for (const name of CATEGORIES) {
    await prisma.serviceCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }
  console.log(`Seeded ${CATEGORIES.length} service categories`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())