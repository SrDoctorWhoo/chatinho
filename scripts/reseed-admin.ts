import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaMssql(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Reseeding admin user and departments...');

  // 1. Create Departments
  const financeiro = await prisma.department.upsert({
    where: { name: 'Financeiro' },
    update: {},
    create: { name: 'Financeiro' }
  });

  const suporte = await prisma.department.upsert({
    where: { name: 'Suporte' },
    update: {},
    create: { name: 'Suporte' }
  });

  console.log('Departments created:', [financeiro.name, suporte.name]);

  // 2. Create Admin User
  const email = 'admin@chatinho.com';
  const password = 'admin';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN'
    },
    create: {
      email,
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`Admin user created/verified: ${user.email}`);
  console.log(`Credentials: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
