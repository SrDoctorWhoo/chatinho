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
      if (integration.type === 'WEBHOOK' || integration.type === 'GENERIC_HTTP' || integration.type === 'OAB_GO_AUTH') {
        return this.handleGenericHttp(node, integration, context, engine);
      }
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

  async handleGenericHttp(node: any, integration: any, context: BotContext, engine: any) {
    const { conversationId, variables, instanceName, remoteJid } = context;
    const url = replaceVars(integration.baseUrl || '', variables);
    const method = (integration.method || 'POST').toUpperCase();
    const headers: any = { 'Content-Type': 'application/json' };
    
    if (integration.apiKey) {
      const finalToken = replaceVars(integration.apiKey, variables);
      headers['Authorization'] = `Bearer ${finalToken}`;
    }

    let body = null;
    if (method !== 'GET' && node.payloadMapping) {
      try {
        const payload = JSON.parse(replaceVars(node.payloadMapping, variables));
        body = JSON.stringify(payload);
      } catch (e) {
        console.warn('[IntegrationProcessor] Payload mapping is not valid JSON, sending as raw string');
        body = replaceVars(node.payloadMapping, variables);
      }
    }

    console.log(`[IntegrationProcessor] Calling ${method} ${url}`);
    const response = await fetch(url, { method, headers, body });
    
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
        if (typeof data === 'string') data = data.replace(/^"|"$/g, '');
      }

      console.log('[IntegrationProcessor] Response Success:', data);

      const updatedVariables = {
        ...variables,
        last_response: data,
        ...(typeof data === 'string' ? { api_token: data } : {}),
        api_result: typeof data === 'object' ? (data.result || data.message || data.status || 'success') : 'success'
      };

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { variables: JSON.stringify(updatedVariables) }
      });

      if (node.nextStepId) {
        await engine.executeNode(node.nextStepId, { ...context, variables: updatedVariables });
      }
    } else {
      const errorText = await response.text();
      console.error(`[IntegrationProcessor] Response Error (${response.status}):`, errorText);
      throw new Error(`HTTP Error ${response.status}`);
    }
  }
};
