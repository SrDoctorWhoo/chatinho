import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const { prisma } = await import('../lib/prisma');
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
  });
