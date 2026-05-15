import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { botEngine } from '@/lib/botEngine';

export async function POST(req: Request) {
  try {
    const { username, password, conversationId } = await req.json();

    if (!conversationId || !username || !password) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Buscar a conversa e a integração
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true, widgetInstance: true }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // Buscar a integração (pode ser OAB_GO_AUTH ou um Webhook chamado 'OAB')
    let integration = await prisma.externalIntegration.findFirst({
      where: { type: 'OAB_GO_AUTH', isActive: true }
    });

    if (!integration) {
      integration = await prisma.externalIntegration.findFirst({
        where: { name: { contains: 'OAB' }, isActive: true }
      });
    }

    const config = integration ? JSON.parse(integration.config || '{}') : {};
    const systemUser = config.systemUsername || process.env.OAB_GO_SYSTEM_USER || 'oabgo';
    const systemPass = config.systemPassword || process.env.OAB_GO_SYSTEM_PASS || 'oabgo@ti*123';
    const baseUrl = (integration?.baseUrl) || 'https://appws.oabgo.org.br/wsapp';

    // 2. Auth Sistema
    const authRes = await fetch(`${baseUrl}/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: systemUser, password: systemPass })
    });

    if (!authRes.ok) throw new Error('Falha na autenticação do sistema OAB-GO');
    const systemToken = (await authRes.text()).replace(/"/g, '');

    // 3. Login Usuário
    const loginRes = await fetch(`${baseUrl}/usuario/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${systemToken}`
      },
      body: JSON.stringify({ username, password })
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok || !loginData.bearerToken) {
      return NextResponse.json({ error: loginData.message || 'Credenciais inválidas' }, { status: 401 });
    }

    // 4. Atualizar conversa
    const currentVars = JSON.parse(conversation.variables || '{}');
    const updatedVariables = {
      ...currentVars,
      user_nome: loginData.nome,
      user_email: loginData.email,
      user_token: loginData.bearerToken,
      user_is_advogado: loginData.isAdvogado ? 'true' : 'false',
      user_pode_anuidade: loginData.isRequerenteVisualizaAnuidade ? 'true' : 'false'
    };

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { variables: JSON.stringify(updatedVariables) }
    });

    // 5. Avançar Fluxo do Bot
    // O bot deve saber que o login foi concluído. 
    // Podemos mover para o próximo nó se houver um StepId ativo.
    if (conversation.currentStepId) {
      const currentNode = await prisma.chatbotNode.findUnique({
        where: { id: conversation.currentStepId }
      });

      if (currentNode && currentNode.nextStepId) {
        // Move para o próximo passo após sucesso
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { currentStepId: currentNode.nextStepId }
        });

        // Trigger bot execution for the next node
        const instanceName = conversation.widgetInstanceId || 'WHATSAPP'; // Fallback
        
        // Obter remoteJid do contato
        const remoteJid = conversation.platform === 'TELEGRAM' 
           ? conversation.contact.number 
           : `${conversation.contact.number}@s.whatsapp.net`;

        // Chamar o motor para executar o próximo nó
        setTimeout(() => {
          botEngine.executeNode(currentNode.nextStepId!, {
            conversationId,
            instanceName,
            remoteJid,
            platform: conversation.platform as any,
            variables: updatedVariables
          });
        }, 1000);
      }
    }

    return NextResponse.json({ success: true, name: loginData.nome });

  } catch (error: any) {
    console.error('[OAB_LOGIN_API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
