import { prisma } from '../prisma';
import { messageDispatcher } from '../messageDispatcher';
import { replaceVars } from './utils';
import { BotContext } from './types';
import { checkAndTriggerDepartmentFlow } from './triggerHandler';

export const aiProcessor = {
  async process(node: any, context: BotContext) {
    const { conversationId, instanceName, remoteJid, variables } = context;

    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation) return;

      let integrationId = node.integrationId;

      // Handle Global Settings
      if (integrationId === 'GLOBAL_INTERNET' || integrationId === 'GLOBAL_COMERCIAL') {
        const settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } });
        integrationId = integrationId === 'GLOBAL_INTERNET' ? settings?.internetIntegId : settings?.comercialIntegId;
      }

      if (!integrationId) {
        await messageDispatcher.send({ conversationId, body: "⚠️ Erro: Nenhuma integração configurada.", type: 'bot' });
        return;
      }

      const integration = await prisma.externalIntegration.findUnique({ where: { id: integrationId } });
      if (!integration) {
        await messageDispatcher.send({ conversationId, body: "⚠️ Erro: Integração não encontrada.", type: 'bot' });
        return;
      }

      // Prepare context/history
      const lastUserMsg = await prisma.message.findFirst({
        where: { conversationId, fromMe: false },
        orderBy: { timestamp: 'desc' }
      });

      const messageText = replaceVars(lastUserMsg?.body || '', variables);
      
      // Prepare context/history - Filter out error messages to keep history clean
      const historyMsgs = await prisma.message.findMany({
        where: { 
          conversationId,
          NOT: { body: { contains: '❌ Erro na integração' } }
        },
        orderBy: { timestamp: 'asc' },
        take: 20
      });
      const historyText = historyMsgs.map((m: any) => `${m.fromMe ? 'Bot' : 'User'}: ${m.body}`).join('\n');
      
      const updatedVars = { 
        ...variables, 
        history: historyText, 
        historico: historyText,
        nome: variables.nome || variables.name || 'Cliente',
        name: variables.nome || variables.name || 'Cliente',
        number: variables.number || variables.telefone || '',
        telefone: variables.number || variables.telefone || '',
        is_first_interaction: historyMsgs.length <= 1 ? 'true' : 'false',
        difyConversationId: conversation.difyConversationId
      };

      console.log(`[AIProcessor] Variáveis atualizadas:`, {
        nome: updatedVars.nome,
        number: updatedVars.number,
        difyId: updatedVars.difyConversationId
      });

      // Call AI API
      let response = await this.callExternalAI(integration, messageText, updatedVars, conversationId, node);
      
      // AUTO-RECOVERY: If 404, it likely means the conversation_id is invalid for this app. 
      // Clear it and retry once.
      if (response.status === 404 && updatedVars.difyConversationId) {
        console.warn(`[AIProcessor] 404 detected. Clearing invalid difyConversationId and retrying...`);
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { difyConversationId: null }
        });
        updatedVars.difyConversationId = null;
        response = await this.callExternalAI(integration, messageText, updatedVars, conversationId, node);
      }
      
      if (response.ok) {
        const { answer, newDifyConvId } = await this.parseAIResponse(response);

        // Update Dify ID if needed
        if (newDifyConvId) {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { difyConversationId: newDifyConvId }
          });
        }

        if (answer) {
          let finalAnswer = replaceVars(answer, updatedVars);
          
          // Check for Transfer tag
          const transferMatch = finalAnswer.match(/\[TRANSFER(?:_DEPT:([a-zA-Z0-9_-]+))?\]/i);
          let shouldTransfer = !!transferMatch;
          let transferDeptId = transferMatch ? transferMatch[1] : null;
          
          if (shouldTransfer) {
            finalAnswer = finalAnswer.replace(/\[TRANSFER(?:_DEPT:[a-zA-Z0-9_-]+)?\]/gi, '').trim();
          }

          // Log AI usage
          await prisma.aIUsage.create({
            data: {
              conversationId,
              integrationId: integration.id,
              action: shouldTransfer ? 'TRANSFER' : 'RESPONSE',
              duration: 0 // Duration calculation could be added
            }
          });

          // Send final response
          if (finalAnswer) {
            await messageDispatcher.send({ 
              conversationId, 
              body: finalAnswer, 
              type: 'bot',
              instanceName,
              remoteJid
            });
          }

          if (shouldTransfer) {
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { 
                isBotActive: false,
                status: 'QUEUED',
                departmentId: transferDeptId || null,
                currentFlowId: null,
                currentStepId: null
              }
            });

            // 🚀 VERIFICAR GATILHO DE FLUXO POR DEPARTAMENTO
            if (transferDeptId) {
              await checkAndTriggerDepartmentFlow(conversationId, transferDeptId);
            }
          }
        }
      } else {
        const errorBody = await response.text();
        console.error(`[AIProcessor] ❌ Erro na integração (${response.status}):`, errorBody);
        
        await messageDispatcher.send({ 
          conversationId, 
          body: `❌ Erro na integração (${response.status}).`, 
          type: 'bot',
          instanceName,
          remoteJid
        });
      }
    } catch (err) {
      console.error('[AIProcessor] Erro fatal:', err);
    }
  },

  async callExternalAI(integration: any, query: string, variables: any, conversationId: string, node?: any) {
    const url = (integration.baseUrl || '').trim();
    const method = (integration.method || 'POST').toUpperCase();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${integration.apiKey}`
    };

    console.log(`[AIProcessor] 🚀 Chamando IA: ${method} ${url}`);

    // Simple mapping for Dify
    if (integration.type === 'DIFY') {
      const { difyConversationId, ...rawInputs } = variables;
      const isWorkflow = url.includes('/workflows/run');
      
      let cleanInputs: any = {};
      
      // APPLY LOW-CODE MAPPING IF EXISTS
      if (node?.payloadMapping) {
        try {
          const mapping = JSON.parse(node.payloadMapping);
          if (Object.keys(mapping).length > 0) {
            Object.entries(mapping).forEach(([difyKey, systemVar]: [string, any]) => {
              // systemVar is something like "{{nome}}"
              cleanInputs[difyKey] = replaceVars(systemVar, variables);
            });
          } else {
            // Default: everything
            Object.keys(rawInputs).forEach(key => {
              cleanInputs[key] = rawInputs[key] || '---';
            });
          }
        } catch (e) {
          console.error('[AIProcessor] Error parsing payloadMapping:', e);
          // Fallback: everything
          Object.keys(rawInputs).forEach(key => {
            cleanInputs[key] = rawInputs[key] || '---';
          });
        }
      } else {
        // Default: everything
        Object.keys(rawInputs).forEach(key => {
          cleanInputs[key] = rawInputs[key] || '---';
        });
      }
      
      // For Workflows, the message must be inside inputs
      if (isWorkflow) {
        cleanInputs.query = query;
        cleanInputs.text = query;
      }

      const rawUser = variables.number || variables.telefone || variables.remoteJid || 'anonymous';
      const userId = String(rawUser).replace(/[^0-9a-zA-Z]/g, '_');

      const difyBody: any = {
        inputs: cleanInputs,
        response_mode: "streaming",
        user: userId
      };

      if (!isWorkflow) {
        difyBody.query = query;
        difyBody.conversation_id = difyConversationId || undefined;
      }
      
      console.log(`[AIProcessor] Payload Dify (${isWorkflow ? 'Workflow' : 'Chat'}):`, JSON.stringify(difyBody));
      
      let res = await fetch(url, { method, headers, body: JSON.stringify(difyBody) });
      
      // If 404 on Chat, try Workflow auto-switch
      if (res.status === 404 && url.includes('/chat-messages')) {
        const workflowUrl = url.replace('/chat-messages', '/workflows/run');
        console.warn(`[AIProcessor] 404 on Chat endpoint. Trying Workflow endpoint: ${workflowUrl}`);
        
        // Prepare workflow payload
        const workflowInputs = { ...cleanInputs, query, text: query };
        const workflowBody = {
          inputs: workflowInputs,
          response_mode: "streaming",
          user: userId
        };
        
        res = await fetch(workflowUrl, { method, headers, body: JSON.stringify(workflowBody) });
      }

      return res;
    }

    // Default for other integrations
    const genericBody = { 
      message: query, 
      variables,
      conversationId 
    };

    console.log(`[AIProcessor] Payload Genérico:`, JSON.stringify(genericBody));
    return fetch(url, { method, headers, body: JSON.stringify(genericBody) });
  },

  async parseAIResponse(response: Response) {
    const contentType = response.headers.get('content-type') || '';
    let answer = '';
    let newDifyConvId = '';

    if (contentType.includes('text/event-stream')) {
      const text = await response.text();
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(5));
            // Chatbot event
            if (data.event === 'message' || data.event === 'agent_message') {
              answer += data.answer || '';
            }
            // Workflow event
            if (data.event === 'workflow_finished' && data.outputs) {
              const out = data.outputs;
              answer = out.answer || out.text || out.output || out.result || JSON.stringify(out);
            }
            if (data.conversation_id) {
              newDifyConvId = data.conversation_id;
            }
          } catch (e) {}
        }
      }
    } else {
      const data = await response.json();
      answer = data.answer || data.response || data.text || '';
      newDifyConvId = data.conversation_id || '';
    }

    return { answer, newDifyConvId };
  }
};
