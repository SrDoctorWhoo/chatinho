import { prisma } from './prisma';
import { whatsappService } from './whatsapp';

export const botEngine = {
  async processMessage(conversationId: string, text: string, instanceName: string, remoteJid: string) {
    try {
      // 1. Carrega a conversa atualizada
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });

      if (!conversation || conversation.status === 'CLOSED') {
        return; 
      }

      // Se o bot está desativado para esta conversa E já existe um fluxo em andamento,
      // ignoramos (atendimento humano assumiu). 
      // Mas se não há fluxo (currentFlowId é null), permitimos continuar para checar gatilhos.
      if (!conversation.isBotActive && conversation.currentFlowId) {
        return;
      }

      let currentFlowId = conversation.currentFlowId;
      let currentStepId = conversation.currentStepId;
      const normalizedInput = (text || '').trim().toLowerCase();

      // 🔍 2. Verificação de Gatilho (Trigger) - Pode reiniciar o fluxo a qualquer momento
      const activeFlows = await prisma.chatbotFlow.findMany({
        where: {
          isActive: true,
          OR: [
            { instances: { some: { instanceId: instanceName } } },
            { instances: { none: {} } }
          ]
        },
        include: {
          nodes: { orderBy: { id: 'asc' }, include: { options: true } }
        }
      });

      let targetFlow = activeFlows.find(f => {
        const keywords = f.triggerKeywords?.split(',').map(k => k.trim().toLowerCase()).filter(k => k !== '') || [];
        return keywords.includes(normalizedInput);
      });

      if (targetFlow) {
        console.log(`[BotEngine] ✅ Gatilho detectado ("${normalizedInput}"). Iniciando/Reiniciando fluxo: ${targetFlow.name}`);
        const firstNode = targetFlow.nodes[0];
        
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            currentFlowId: targetFlow.id,
            currentStepId: firstNode.id,
            status: 'BOT',
            isBotActive: true
          }
        });

        return this.executeNode(firstNode, conversationId, instanceName, remoteJid);
      }

      if (!currentFlowId) {
        let defaultFlow = activeFlows.find(f => f.isDefault) || activeFlows.find(f => !f.triggerKeywords || f.triggerKeywords.trim() === '');

        if (!defaultFlow || !defaultFlow.nodes || defaultFlow.nodes.length === 0) {
          console.log('[BotEngine] Nenhum fluxo correspondente ou padrão encontrado.');
          return;
        }

        console.log(`[BotEngine] ✅ Usando fluxo padrão: ${defaultFlow.name}`);
        const firstNode = defaultFlow.nodes[0];
        
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            currentFlowId: defaultFlow.id,
            currentStepId: firstNode.id,
            status: 'BOT',
            isBotActive: true
          }
        });

        return this.executeNode(firstNode, conversationId, instanceName, remoteJid);
      }

      const currentNode = await prisma.chatbotNode.findUnique({
        where: { id: currentStepId as string },
        include: { options: true }
      });

      if (!currentNode) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { currentFlowId: null, currentStepId: null }
        });
        return;
      }

      if (currentNode.type === 'MENU' || currentNode.type === 'LIST') {
        const options = currentNode.options;
        const normalizedText = (text || '').trim().toLowerCase();
        
        const matchedOption = options.find(opt => 
          opt.keyword.trim().toLowerCase() === normalizedText ||
          opt.label.trim().toLowerCase() === normalizedText
        );

        if (matchedOption) {
          if (matchedOption.targetFlowId) {
            return this.triggerFlow(matchedOption.targetFlowId, conversation.id, instanceName, remoteJid);
          }

          const nextNode = await prisma.chatbotNode.findUnique({
            where: { id: matchedOption.targetNodeId as string },
            include: { options: true }
          });

          if (nextNode) {
            await prisma.conversation.update({
              where: { id: conversation.id },
              data: { currentStepId: nextNode.id }
            });
            await this.executeNode(nextNode, conversation.id, instanceName, remoteJid);
          }
        } else {
          await whatsappService.sendMessage(instanceName, remoteJid, "❌ *Opção inválida.* Por favor, escolha uma das opções abaixo:");
          await this.executeNode(currentNode, conversation.id, instanceName, remoteJid);
        }
      } else if (currentNode.type === 'AI_DIFY') {
        await this.executeNode(currentNode, conversation.id, instanceName, remoteJid);
      } else if (currentNode.type === 'WAIT_INPUT') {
        const variableName = currentNode.variableName || 'input';
        let variables = {};
        try {
          variables = JSON.parse(conversation.variables || '{}');
        } catch (e) {}

        variables[variableName] = text;
        console.log(`[BotEngine] 📥 Variável capturada: ${variableName} = ${text}`);

        // Update in memory for immediate use in executeNode
        const updatedVariablesStr = JSON.stringify(variables);
        conversation.variables = updatedVariablesStr;
        conversation.currentStepId = currentNode.nextStepId;

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { 
            variables: updatedVariablesStr,
            currentStepId: currentNode.nextStepId
          }
        });

        if (currentNode.nextStepId) {
          const nextNode = await prisma.chatbotNode.findUnique({
            where: { id: currentNode.nextStepId },
            include: { options: true }
          });
          if (nextNode) {
            await this.executeNode(nextNode, conversation.id, instanceName, remoteJid);
          }
        }
      }
    } catch (err) {
      console.error('[BotEngine] Erro ao processar:', err);
    }
  },

  async executeNode(node: any, conversationId: string, instanceName: string, remoteJid: string) {
    if (!node) return;

    if (node.type === 'MESSAGE' || node.type === 'MENU' || node.type === 'LIST' || node.type === 'AI_DIFY' || node.type === 'WAIT_INPUT') {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { contact: true }
      });

      let variables: any = {};
      try {
        variables = JSON.parse(conversation?.variables || '{}');
      } catch (e) {}

      variables.nome = conversation?.contact?.name || 'Cliente';
      variables.name = variables.nome;
      variables.telefone = conversation?.contact?.number || '';
      variables.number = variables.telefone;

      const replaceVars = (str: string) => {
        if (!str) return str;
        let newStr = str;
        Object.keys(variables).forEach(key => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
          newStr = newStr.replace(regex, variables[key]);
        });
        return newStr;
      };

      if (node.type === 'AI_DIFY') {
        try {
          if (!node.integrationId) {
            await whatsappService.sendMessage(instanceName, remoteJid, "⚠️ Erro: Nenhuma integração configurada para este passo.");
            return;
          }

          const integration = await prisma.externalIntegration.findUnique({
            where: { id: node.integrationId }
          });

          if (!integration) {
            await whatsappService.sendMessage(instanceName, remoteJid, "⚠️ Erro: Integração não encontrada.");
            return;
          }

          const lastUserMsg = await prisma.message.findFirst({
            where: { conversationId, fromMe: false },
            orderBy: { timestamp: 'desc' }
          });

          const messageText = replaceVars(lastUserMsg?.body || '');
          const contactName = variables.nome;
          const contactNumber = variables.telefone;
          
          let url = integration.baseUrl;
          const method = (integration.method || 'POST').toUpperCase();
          const options: RequestInit = {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...(integration.apiKey ? { 'Authorization': `Bearer ${integration.apiKey}` } : {})
            }
          };

          if (integration.type === 'DIFY') {
            options.body = JSON.stringify({
              inputs: variables,
              query: messageText,
              response_mode: "blocking",
              user: contactNumber
            });
          } else if (integration.type === 'OPENAI') {
            options.body = JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: messageText }]
            });
          } else {
            if (method === 'GET') {
              const params = new URLSearchParams({
                message: messageText,
                contactName,
                contactNumber,
                ...variables
              });
              url = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
            } else {
              options.body = JSON.stringify({
                message: messageText,
                contact: { name: contactName, number: contactNumber },
                conversationId,
                variables,
                config: integration.config || {}
              });
            }
          }

          const response = await fetch(url, options);
          const responseText = await response.text();

          if (response.ok) {
            let answer = "";
            try {
              const data = JSON.parse(responseText);
              answer = data.answer || data.response || data.output || data.text || data.result || "";
              if (!answer && data.event === 'message') answer = data.answer;
            } catch (e) {
              answer = responseText;
            }

            if (answer) {
              const finalAnswer = replaceVars(answer);
              await whatsappService.sendMessage(instanceName, remoteJid, finalAnswer);
              await prisma.message.create({
                data: { conversationId, body: finalAnswer, fromMe: true, type: 'chat' }
              });
            }
          } else {
            let errorMsg = "❌ Erro na integração.";
            if (response.status === 404) errorMsg = "❌ Erro 404 na IA.";
            await whatsappService.sendMessage(instanceName, remoteJid, errorMsg);
          }
        } catch (err) {
          console.error('[BotEngine] Erro fatal:', err);
        }
      }

      if (node.content && node.type !== 'AI_DIFY') {
        let finalContent = replaceVars(node.content);

        if (node.type === 'LIST' && node.options && node.options.length > 0) {
          try {
            await whatsappService.sendListMessage(instanceName, remoteJid, {
              title: "Opções",
              description: finalContent,
              buttonText: "Ver Opções",
              footer: "Escolha uma opção",
              sections: [{
                title: "Menu",
                rows: node.options.map((opt: any) => ({
                  title: opt.label,
                  rowId: opt.keyword
                }))
              }]
            });
          } catch (err) {
            const optionsText = node.options.map((opt: any) => `*${opt.keyword}* - ${opt.label}`).join('\n');
            await whatsappService.sendMessage(instanceName, remoteJid, `${finalContent}\n\n${optionsText}`);
          }
        } else if (node.type === 'MENU' && node.options && node.options.length > 0) {
          const optionsText = node.options.map((opt: any) => `*${opt.keyword}* - ${opt.label}`).join('\n');
          await whatsappService.sendMessage(instanceName, remoteJid, `${finalContent}\n\n${optionsText}`);
        } else {
          await whatsappService.sendMessage(instanceName, remoteJid, finalContent);
        }
        
        await prisma.message.create({
          data: {
            conversationId,
            body: node.type === 'LIST' ? `[LISTA: ${finalContent}]` : finalContent,
            fromMe: true,
            type: 'chat'
          }
        });
      }

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      if (node.targetFlowId) {
        return this.triggerFlow(node.targetFlowId, conversationId, instanceName, remoteJid);
      }

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
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.executeNode(nextNode, conversationId, instanceName, remoteJid);
        }
      }
    } else if (node.type === 'TRANSFER' || node.routingDepartmentId) {
      if (node.content) {
        await whatsappService.sendMessage(instanceName, remoteJid, node.content);
        await prisma.message.create({
          data: { conversationId, body: node.content, fromMe: true, type: 'chat' }
        });
      }
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { 
          isBotActive: false,
          status: 'QUEUED',
          departmentId: node.routingDepartmentId || null,
          currentFlowId: null,
          currentStepId: null,
          lastMessageAt: new Date()
        }
      });
    }
  },

  async triggerFlow(flowId: string, conversationId: string, instanceName: string, remoteJid: string) {
    const flow = await prisma.chatbotFlow.findUnique({
      where: { id: flowId },
      include: { nodes: { orderBy: { id: 'asc' }, include: { options: true } } }
    });

    if (!flow || !flow.nodes || flow.nodes.length === 0) {
      console.log(`[BotEngine] ⚠️ Falha ao acionar fluxo ${flowId}: Fluxo não encontrado ou sem nós.`);
      return;
    }

    console.log(`[BotEngine] 🔀 Trocando fluxo para: ${flow.name}`);
    const firstNode = flow.nodes[0];
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        currentFlowId: flow.id,
        currentStepId: firstNode.id,
        status: 'BOT',
        isBotActive: true
      }
    });

    return this.executeNode(firstNode, conversationId, instanceName, remoteJid);
  }
};
