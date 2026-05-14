import { prisma } from '../prisma';
import { messageDispatcher } from '../messageDispatcher';
import { replaceVars } from './utils';
import { BotContext } from './types';
import { checkAndTriggerDepartmentFlow } from './triggerHandler';
import { integrationProcessor } from './integrationProcessor';

export const nodeProcessor = {
  async process(node: any, context: BotContext, engine: any) {
    const { conversationId, variables, instanceName, remoteJid } = context;

    // 🚀 PROCESSAR INTEGRAÇÃO SE EXISTIR
    if (node.integrationId) {
      const fullNode = await prisma.chatbotNode.findUnique({
        where: { id: node.id },
        include: { integration: true }
      });
      if (fullNode?.integration) {
        return integrationProcessor.process(fullNode, context, engine);
      }
    }

    if (node.type === 'MESSAGE' || node.type === 'MENU' || node.type === 'LIST' || node.type === 'WAIT_INPUT') {
      if (node.content) {
        let finalContent = replaceVars(node.content, variables);
        
        // 🔗 Gerar link de auth se solicitado
        if (finalContent.includes('{{auth_oab_link}}')) {
          const appUrl = process.env.APP_URL || 'http://localhost:3000';
          const authLink = `${appUrl}/auth/oab?convId=${conversationId}`;
          finalContent = finalContent.replace('{{auth_oab_link}}', authLink);
        }
        
        if (node.type === 'LIST' && node.options?.length > 0) {
          await messageDispatcher.send({ conversationId, body: finalContent, type: 'bot', instanceName, remoteJid });
        } else if (node.type === 'MENU' && node.options?.length > 0) {
          const optionsText = node.options.map((opt: any) => `*${opt.keyword}* - ${opt.label}`).join('\n');
          await messageDispatcher.send({ conversationId, body: `${finalContent}\n\n${optionsText}`, type: 'bot', instanceName, remoteJid });
        } else {
          await messageDispatcher.send({ conversationId, body: finalContent, type: 'bot', instanceName, remoteJid });
        }
      }

      // Handle transfers directly in node
      if (node.type === 'TRANSFER' || node.routingDepartmentId) {
        if (node.content) {
           await messageDispatcher.send({ conversationId, body: replaceVars(node.content, variables), type: 'bot', instanceName, remoteJid });
        }
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { 
            isBotActive: false,
            status: 'QUEUED',
            departmentId: node.routingDepartmentId || null,
            currentFlowId: null,
            currentStepId: null
          }
        });

        // 🚀 VERIFICAR GATILHO DE FLUXO POR DEPARTAMENTO
        if (node.routingDepartmentId) {
          await checkAndTriggerDepartmentFlow(conversationId, node.routingDepartmentId);
        }
        
        return;
      }

      // Move to next step if automatic
      if ((node.type === 'MESSAGE' || node.type === 'AI_DIFY') && node.nextStepId) {
        const nextNode = await prisma.chatbotNode.findUnique({
          where: { id: node.nextStepId },
          include: { options: true }
        });
        if (nextNode) {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { currentStepId: nextNode.id }
          });
          // Small delay for natural feel
          await new Promise(resolve => setTimeout(resolve, 1000));
          await engine.executeNode(nextNode.id, context);
        }
      }
    }
  }
};
