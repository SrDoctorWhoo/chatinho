import { prisma } from './lib/prisma';

async function main() {
  console.log('--- Listando modelos do Prisma ---');
  const props = Object.keys(prisma);
  console.log('Propriedades disponíveis:', props.filter(p => !p.startsWith('_')));
  
  if ((prisma as any).widgetInstance) {
    console.log('✅ widgetInstance ENCONTRADO');
  } else {
    console.log('❌ widgetInstance NÃO encontrado');
  }
}

main();
