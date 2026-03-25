const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (existingAdmin) {
    console.log('Admin already exists')
    return
  }
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.create({
    data: {
      email: 'admin@agency',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })
  console.log('Admin created successfully: admin@agency / admin123')
}

main().catch(console.error).finally(() => prisma.$disconnect());
