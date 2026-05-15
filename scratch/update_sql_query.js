import { prisma } from '../lib/prisma';

async function main() {
  await prisma.chatbotNode.update({
    where: { id: 'cmp6ahsz30000sct2lcl1ol3e' },
    data: { 
      content: `SELECT *
FROM SANKHYA.VW_ANUIDADES_NEGOCIACOES_ABERTAS
WHERE CODPARC = {{codParc}}
ORDER BY DTVENC;`
    }
  });
  console.log('QUERY ATUALIZADA COM SUCESSO');
}

main().catch(console.error).finally(() => prisma.$disconnect());
