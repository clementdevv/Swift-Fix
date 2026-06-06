
import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const count = await prisma.serviceCategory.count()
  console.log('Categories in DB:', count)
}

main().finally(() => prisma.$disconnect())