import { prisma } from '../prisma';
import { replaceVars } from './utils';
import { BotContext } from './types';
import { messageDispatcher } from '../messageDispatcher';

export const integrationProcessor = {
  async process(node: any, context: BotContext, engine: any) {
    const { conversationId, variables, instanceName, remoteJid } = context;
    const integration = node.integration;

    if (!integration) return;

    console.log(`[IntegrationProcessor] Processando integração: ${integration.name} (${integration.type})`);

    try {
      if (integration.type === 'OAB_GO_AUTH') {
        return this.handleOabGoAuth(node, integration, context, engine);
      }

      // Generic HTTP Integration (Placeholder for future)
      // await this.handleGenericHttp(node, integration, context, engine);
      
    } catch (error: any) {
      console.error(`[IntegrationProcessor] Erro na integração ${integration.name}:`, error);
      await messageDispatcher.send({ 
        conversationId, 
        body: '⚠️ Ocorreu um erro ao processar a validação externa. Por favor, tente novamente mais tarde.', 
        type: 'bot', 
        instanceName, 
        remoteJid 
      });
    }
  },

  async handleOabGoAuth(node: any, integration: any, context: BotContext, engine: any) {
    const { conversationId, variables, instanceName, remoteJid } = context;

    // 1. Obter Token do Sistema (Authenticate)
    // Username e Password do sistema devem estar no config da integração
    const config = JSON.parse(integration.config || '{}');
    const systemUser = config.systemUsername || process.env.OAB_GO_SYSTEM_USER;
    const systemPass = config.systemPassword || process.env.OAB_GO_SYSTEM_PASS;
    const baseUrl = integration.baseUrl || 'https://appws.oabgo.org.br/wsapp';

    console.log('[OAB_GO_AUTH] Obtendo token do sistema...');
    const authRes = await fetch(`${baseUrl}/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: systemUser, password: systemPass })
    });

    if (!authRes.ok) throw new Error('Falha na autenticação do sistema OAB-GO');
    
    // A API retorna o token (pode ser texto puro ou JSON, vamos tratar ambos)
    const systemToken = await authRes.text(); 
    // Nota: Se for JSON, o usuário pode precisar ajustar aqui, mas Swagger indica retorno do token.

    // 2. Validar Usuário (Login)
    // Username e Password do usuário devem estar nas variáveis da conversa (coletadas via WAIT_INPUT)
    const userLogin = variables.cpf || variables.username || variables.login;
    const userPass = variables.senha || variables.password;

    if (!userLogin || !userPass) {
       await messageDispatcher.send({ 
         conversationId, 
         body: '❌ Não encontrei seus dados de acesso (CPF e Senha). Por favor, reinicie o processo.', 
         type: 'bot', 
         instanceName, 
         remoteJid 
       });
       return;
    }

    console.log(`[OAB_GO_AUTH] Validando usuário: ${userLogin}`);
    const loginRes = await fetch(`${baseUrl}/usuario/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${systemToken.replace(/"/g, '')}` // Limpar aspas se houver
      },
      body: JSON.stringify({ username: userLogin, password: userPass })
    });

    const loginData = await loginRes.json();

    if (loginRes.ok && loginData.bearerToken) {
      console.log('[OAB_GO_AUTH] Login realizado com sucesso!');
      
      // Salvar dados do usuário nas variáveis da conversa
      const updatedVariables = {
        ...variables,
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

      // Se houver uma mensagem de sucesso no nó, envia
      if (node.content) {
        await messageDispatcher.send({ 
          conversationId, 
          body: replaceVars(node.content, updatedVariables), 
          type: 'bot', 
          instanceName, 
          remoteJid 
        });
      }

      // Seguir para o próximo passo (Sucesso)
      if (node.nextStepId) {
        await engine.executeNode(node.nextStepId, { ...context, variables: updatedVariables });
      }
    } else {
      console.log('[OAB_GO_AUTH] Falha no login do usuário.');
      
      // Se houver opções no nó, podemos usar a primeira como "Falha" ou enviar msg padrão
      const errorMsg = loginData.message || '❌ CPF ou Senha incorretos. Por favor, verifique seus dados e tente novamente.';
      await messageDispatcher.send({ conversationId, body: errorMsg, type: 'bot', instanceName, remoteJid });
      
      // Opcional: Voltar para o início ou para um nó de erro se houver uma opção específica
    }
  }
};
