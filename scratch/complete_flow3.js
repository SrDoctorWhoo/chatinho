import { prisma } from '../lib/prisma';

async function main() {
  const flow3 = await prisma.chatbotFlow.findFirst({
    where: { name: '3. Consulta de Boletos' },
    include: { nodes: true }
  });

  if (!flow3) return;

  const aiNode1 = flow3.nodes.find(n => n.title === 'IA Pós-Login');
  
  // 1. Criar o Nó SQL
  const sqlNode = await prisma.chatbotNode.create({
    data: {
      flowId: flow3.id,
      type: 'SQL_QUERY',
      title: 'Busca Boletos Sankhya',
      content: 'SELECT * FROM SANKHYA.VW_ANUIDADES_NEGOCIACOES_ABERTAS WHERE CODPARC = {{codparcColaborador}} ORDER BY DTVENC;',
      order: 2
    }
  });

  // 2. Criar o Nó de IA final para mostrar os resultados
  const aiNodeFinal = await prisma.chatbotNode.create({
    data: {
      flowId: flow3.id,
      type: 'AI_DIFY',
      title: 'Mostrar Boletos',
      content: 'Aqui estão seus boletos encontrados: {{sql_result}}',
      integrationId: 'cmp1psc6o0000lwtip9kegwjo',
      order: 3
    }
  });

  // 3. Ligar os pontos
  if (aiNode1) {
    await prisma.chatbotNode.update({
      where: { id: aiNode1.id },
      data: { nextStepId: sqlNode.id }
    });
  }

  await prisma.chatbotNode.update({
    where: { id: sqlNode.id },
    data: { nextStepId: aiNodeFinal.id }
  });

  console.log('Fluxo 3 completo: IA -> SQL -> IA');
}

main().catch(console.error).finally(() => prisma.$disconnect());
