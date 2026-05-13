const { PrismaClient } = require('@prisma/client');
const { PrismaMssql } = require('@prisma/adapter-mssql');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || '';
const adapter = new PrismaMssql(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  const logs = await prisma.auditLog.findMany({
    where: { action: 'ERROR' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
