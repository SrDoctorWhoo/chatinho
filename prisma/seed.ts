import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('--- SEED SQL SERVER (via lib/prisma) ---');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  try {
    const admin = await prisma.user.upsert({
      where: { email: 'admin@admin.com' },
      update: {},
      create: {
        email: 'admin@admin.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('✅ Usuário Admin criado com sucesso!');
    console.log('Email: admin@admin.com');
    console.log('Senha: admin123');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
