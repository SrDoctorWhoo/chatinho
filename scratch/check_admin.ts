import { PrismaClient } from '@prisma/client';
import { PrismaMssql } from '@prisma/adapter-mssql';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaMssql(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@admin.com' }
  });
  console.log('Admin user in DB:', admin);
  
  const allUsers = await prisma.user.findMany();
  console.log('Total users in DB:', allUsers.length);
  allUsers.forEach(u => console.log(`- ${u.name} (${u.email})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
