import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { botEngine } from '@/lib/botEngine';

export async function POST(req: Request) {
  try {
    const { username, password, conversationId, integrationId } = await req.json();

    if (!conversationId || !username || !password || !integrationId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // 1. Buscar a conversa e a integração
    const [conversation, integration] = await Promise.all([
      prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { contact: true }
      }),
      prisma.externalIntegration.findUnique({
        where: { id: integrationId }
      })
    ]);

    if (!conversation || !integration) {
      return NextResponse.json({ error: 'Conversa ou Integração não encontrada' }, { status: 404 });
    }

    const baseUrl = integration.baseUrl;
    if (!baseUrl) return NextResponse.json({ error: 'URL da integração não configurada' }, { status: 500 });

    // 2. Garantir que a URL base seja limpa (apenas o origin)
    const url = new URL(baseUrl);
    const cleanBaseUrl = url.origin;

    // Etapa 1: Autenticação para pegar o Token
    console.log(`[ExternalLogin] Etapa 1: Autenticando em ${cleanBaseUrl}/wsapp/authenticate`);
    const authRes = await fetch(`${cleanBaseUrl}/wsapp/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!authRes.ok) {
      const errorData = await authRes.text();
      console.error('[ExternalLogin] Erro Etapa 1:', errorData);
      return NextResponse.json({ error: 'Falha na autenticação inicial' }, { status: 401 });
    }

    const authData = await authRes.json();
    const token = authData.token || authData.bearerToken || authData.access_token;

    if (!token) {
      return NextResponse.json({ error: 'Token não recebido na Etapa 1' }, { status: 401 });
    }

    // 3. Etapa 2: Buscar dados do usuário usando o Token
    console.log(`[ExternalLogin] Etapa 2: Buscando dados em ${cleanBaseUrl}/wsapp/usuario/login`);
    const profileRes = await fetch(`${cleanBaseUrl}/wsapp/usuario/login`, {
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ username, password }) 
    });

    if (!profileRes.ok) {
      console.error('[ExternalLogin] Erro Etapa 2:', await profileRes.text());
      return NextResponse.json({ error: 'Falha ao buscar dados do perfil' }, { status: 401 });
    }

    const loginData = await profileRes.json();

    // 4. Salvar tudo na Conversa
    const currentVars = JSON.parse(conversation.variables || '{}');
    const externalData = typeof loginData === 'object' ? loginData : {};
    
    const updatedVariables = {
      ...currentVars,
      ...externalData,
      api_token: token,
      username: username, 
      user_logged_in: 'true',
      login_timestamp: new Date().toISOString()
    };

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { variables: JSON.stringify(updatedVariables) }
    });

    // 4. Avançar o Bot para o próximo passo se houver
    if (conversation.currentStepId) {
      const currentNode = await prisma.chatbotNode.findUnique({
        where: { id: conversation.currentStepId }
      });

      if (currentNode) {
        // Obter remoteJid do contato
        const remoteJid = conversation.platform === 'TELEGRAM' 
           ? conversation.contact.number 
           : `${conversation.contact.number}@s.whatsapp.net`;

        const executionContext = {
          conversationId,
          instanceName: updatedVariables.instanceName || 'WHATSAPP',
          remoteJid,
          platform: conversation.platform as any,
          variables: updatedVariables
        };

        // Prioridade 1: Próximo Passo no mesmo fluxo
        if (currentNode.nextStepId) {
          console.log(`[ExternalLogin] Avançando para o próximo nó: ${currentNode.nextStepId}`);
          setTimeout(() => {
            botEngine.executeNode(currentNode.nextStepId!, executionContext);
          }, 1000);
        } 
        // Prioridade 2: Pular para outro fluxo
        else if (currentNode.targetFlowId) {
          console.log(`[ExternalLogin] Pulando para o fluxo definido no nó: ${currentNode.targetFlowId}`);
          setTimeout(() => {
            botEngine.triggerFlow(currentNode.targetFlowId!, executionContext);
          }, 1000);
        } 
        // Prioridade 3: Fallback automático para Consulta de Boletos
        else {
          console.log('[ExternalLogin] Nenhum passo no nó. Buscando fluxo "3. Consulta de Boletos" como fallback.');
          const flow3 = await prisma.chatbotFlow.findFirst({ where: { name: '3. Consulta de Boletos' } });
          if (flow3) {
            setTimeout(() => {
              botEngine.triggerFlow(flow3.id, executionContext);
            }, 1000);
          } else {
            console.error('[ExternalLogin] Fallback falhou: Fluxo 3 não encontrado.');
          }
        }
      }
    }

    return NextResponse.json({ success: true, token: updatedVariables.api_token });

  } catch (error: any) {
    console.error('[ExternalLogin_API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
