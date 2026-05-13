import { prisma } from './prisma';
import { whatsappService } from './whatsapp';

const broadcastMessage = async (messageId: string) => {
  try {
    const enrichedMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            contact: true,
            department: true,
            assignedTo: { select: { id: true, name: true } }
          }
        }
      }
    });
    if (enrichedMessage) {
      await fetch(process.env.SOCKET_URL || 'http://127.0.0.1:3005/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new_message',
          data: {
            message: enrichedMessage,
            conversationId: enrichedMessage.conversationId,
            conversation: enrichedMessage.conversation
          }
        })
      });
    }
  } catch (err) {
    console.error('[BotEngine] Erro ao notificar socket:', err);
  }
};

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
            { isDefault: true },
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
        
        const { generateProtocol } = await import('./protocol');
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            currentFlowId: targetFlow.id,
            currentStepId: firstNode.id,
            status: 'BOT',
            isBotActive: true,
            protocol: conversation.protocol || generateProtocol()
          }
        });

        return this.executeNode(firstNode, conversationId, instanceName, remoteJid);
      }

      if (!currentFlowId) {
        const settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } });
        let defaultFlow = null;

        if (settings?.welcomeFlowId) {
          defaultFlow = activeFlows.find(f => f.id === settings.welcomeFlowId);
        }

        if (!defaultFlow) {
          defaultFlow = activeFlows.find(f => f.isDefault) || activeFlows.find(f => !f.triggerKeywords || f.triggerKeywords.trim() === '');
        }

        if (!defaultFlow || !defaultFlow.nodes || defaultFlow.nodes.length === 0) {
          console.log('[BotEngine] Nenhum fluxo correspondente ou padrão encontrado.');
          return;
        }

        console.log(`[BotEngine] ✅ Usando fluxo (Boas-vindas/Padrão): ${defaultFlow.name}`);
        const firstNode = defaultFlow.nodes[0];
        
        const { generateProtocol } = await import('./protocol');
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            currentFlowId: defaultFlow.id,
            currentStepId: firstNode.id,
            status: 'BOT',
            isBotActive: true,
            protocol: conversation.protocol || generateProtocol()
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
          opt.id === text ||
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
            // Se o nó atual tiver um variableName, salva a escolha do usuário
            if (currentNode.variableName) {
              let vars: Record<string, any> = {};
              try { vars = JSON.parse(conversation.variables || '{}'); } catch (e) {}
              vars[currentNode.variableName] = matchedOption.label || matchedOption.keyword;
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: { variables: JSON.stringify(vars) }
              });
            }

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
        let variables: Record<string, any> = {};
        try {
          variables = JSON.parse(conversation.variables || '{}');
        } catch (e) {}

        const valueToSave = text || "[Mídia/Arquivo]";
        variables[variableName] = valueToSave;
        console.log(`[BotEngine] 📥 Variável capturada: ${variableName} = ${valueToSave}`);

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

  async executeNode(node: any, conversationId: string, instanceName: string, remoteJid: string): Promise<void> {
    if (!node) return;

    if (node.type === 'MESSAGE' || node.type === 'MENU' || node.type === 'LIST' || node.type === 'AI_DIFY' || node.type === 'WAIT_INPUT') {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { contact: true }
      });

      if (!conversation) return;

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
          let integrationId = node.integrationId;

          if (integrationId === 'GLOBAL_INTERNET' || integrationId === 'GLOBAL_COMERCIAL') {
            const settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } });
            if (integrationId === 'GLOBAL_INTERNET') {
              integrationId = settings?.internetIntegId || null;
            } else {
              integrationId = settings?.comercialIntegId || null;
            }
          }

          if (!integrationId) {
            await whatsappService.sendMessage(instanceName, remoteJid, "⚠️ Erro: Nenhuma integração configurada ou selecionada.");
            return;
          }

          const integration = await prisma.externalIntegration.findUnique({
            where: { id: integrationId }
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
          
          const historyMsgs = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { timestamp: 'asc' },
            take: 20
          });
          const historyText = historyMsgs.map((m: any) => `${m.fromMe ? 'Bot' : 'User'}: ${m.body}`).join('\n');
          variables.historico = historyText;
          variables.history = historyText;
          variables.is_first_interaction = historyMsgs.length <= 1 ? 'true' : 'false';
          
          const depts = await prisma.department.findMany({ select: { id: true, name: true, description: true } });
          const deptsText = depts.map(d => `ID: ${d.id} | Nome: ${d.name} ${d.description ? `| Descrição: ${d.description}` : ''}`).join('\n');
          variables.departamentos = deptsText;
          
          const url = integration.baseUrl;
          if (!url) {
            await whatsappService.sendMessage(instanceName, remoteJid, "⚠️ Erro: URL da integração não configurada.");
            return;
          }
          const method = (integration.method || 'POST').toUpperCase();
          const options: RequestInit = {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...(integration.apiKey ? { 'Authorization': `Bearer ${integration.apiKey}` } : {})
            }
          };

          let finalUrl = url;
          if (integration.type === 'DIFY') {
            options.body = JSON.stringify({
              inputs: variables,
              query: messageText,
              response_mode: "streaming",
              user: contactNumber,
              conversation_id: conversation?.difyConversationId || undefined
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
              finalUrl = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
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

          const startTime = Date.now();
          const response = await fetch(finalUrl, options);
          const duration = Date.now() - startTime;
          const contentType = response.headers.get('content-type') || '';
          
          let responseText = '';
          let difyConvId = '';

          if (contentType.includes('text/event-stream')) {
            const text = await response.text();
            const lines = text.split('\n');
            let fullAnswer = '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const chunk = JSON.parse(line.substring(6));
                  if (chunk.conversation_id) difyConvId = chunk.conversation_id;
                  if (chunk.event === 'message' || chunk.event === 'agent_message') {
                    fullAnswer += chunk.answer || '';
                  }
                } catch (e) {}
              }
            }
            responseText = JSON.stringify({ answer: fullAnswer, conversation_id: difyConvId });
          } else {
            responseText = await response.text();
          }

            if (response.ok) {
              let answer = "";
              let newDifyConvId = "";
              try {
                const data = JSON.parse(responseText);
                answer = data.answer || data.response || data.output || data.text || data.result || "";
                newDifyConvId = data.conversation_id || "";
                if (!answer && data.event === 'message') answer = data.answer;
              } catch (e) {
                answer = responseText;
              }

              // Salvar o conversation_id do Dify para manter o contexto
              if (newDifyConvId && newDifyConvId !== conversation.difyConversationId) {
                try {
                  await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { difyConversationId: newDifyConvId }
                  });
                  console.log(`[BotEngine] 🔗 Dify Conversation ID vinculado: ${newDifyConvId}`);
                } catch (e) {
                  console.error('[BotEngine] Erro ao salvar Dify Conv ID:', e);
                }
              }

              if (answer) {
              // Extrair Resumo da IA se existir
              const summaryMatch = answer.match(/\[SUMMARY:(.*?)\]/i);
              let aiSummary = null;
              if (summaryMatch) {
                aiSummary = summaryMatch[1].trim();
                answer = answer.replace(/\[SUMMARY:.*?\]/gi, '').trim();
              }

              let finalAnswer = replaceVars(answer);
              let shouldTransfer = false;
              let transferDeptId = null;

              const transferMatch = finalAnswer.match(/\[TRANSFER(?:_DEPT:([a-zA-Z0-9_-]+))?\]/i);
              if (transferMatch) {
                shouldTransfer = true;
                transferDeptId = transferMatch[1] || null;
                finalAnswer = finalAnswer.replace(/\[TRANSFER(?:_DEPT:[a-zA-Z0-9_-]+)?\]/gi, '').trim();
              }

              // Registrar uso da IA
              try {
                await prisma.aIUsage.create({
                  data: {
                    conversationId,
                    integrationId: integration.id,
                    action: shouldTransfer ? 'TRANSFER' : 'RESPONSE',
                    duration: duration
                  }
                });
              } catch (e) {
                console.error('[BotEngine] Erro ao registrar uso da IA:', e);
              }

              // Se houver resumo, salvar na conversa e criar nota interna
              if (aiSummary) {
                try {
                  await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { aiSummary }
                  });

                  const newInternalMsg = await prisma.message.create({
                    data: {
                      conversationId,
                      body: `📝 RESUMO DA IA: ${aiSummary}`,
                      fromMe: true,
                      type: 'internal'
                    }
                  });
                  await broadcastMessage(newInternalMsg.id);
                } catch (e) {
                  console.error('[BotEngine] Erro ao salvar resumo:', e);
                }
              }

              if (finalAnswer) {
                await whatsappService.sendMessage(instanceName, remoteJid, finalAnswer);
                const newMsg = await prisma.message.create({
                  data: { conversationId, body: finalAnswer, fromMe: true, type: 'chat' }
                });
                await broadcastMessage(newMsg.id);
              }

              if (shouldTransfer) {
                await prisma.conversation.update({
                  where: { id: conversationId },
                  data: { 
                    isBotActive: false,
                    status: 'QUEUED',
                    departmentId: transferDeptId || null,
                    currentFlowId: null,
                    currentStepId: null,
                    lastMessageAt: new Date()
                  }
                });
                return;
              }
            }
          } else {
            let errorMsg = `❌ Erro na integração (${response.status}).`;
            try {
               const errData = JSON.parse(responseText);
               errorMsg += ` Motivo: ${errData.message || errData.code || responseText.substring(0, 50)}`;
            } catch(e) {
               errorMsg += ` Motivo: ${responseText.substring(0, 50)}`;
            }
            console.error('BotEngine Integration Error:', response.status, responseText);
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
              title: node.title || "Opções",
              description: finalContent,
              buttonText: node.buttonText || "Ver Opções",
              footer: node.footer || "Escolha uma opção",
              sections: [{
                title: "Menu",
                rows: node.options.map((opt: any) => ({
                  title: opt.label || "Opção",
                  description: "",
                  rowId: opt.id
                }))
              }]
            });
          } catch (err: any) {
            console.error('[Evolution] Erro ao enviar lista:', err);
            // Registrar log de erro
            try {
              const { createAuditLog } = await import('@/lib/audit');
              const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
              await createAuditLog({
                action: 'LOG',
                description: `Falha ao enviar Lista Wpp: ${errorDetail}`,
                target: 'Sistema',
                type: 'error'
              });
            } catch (e) {}
            
            const optionsText = node.options.map((opt: any) => `*${opt.keyword}* - ${opt.label}`).join('\n');
            await whatsappService.sendMessage(instanceName, remoteJid, `${finalContent}\n\n${optionsText}`);
          }
        } else if (node.type === 'MENU' && node.options && node.options.length > 0) {
          const optionsText = node.options.map((opt: any) => `*${opt.keyword}* - ${opt.label}`).join('\n');
          await whatsappService.sendMessage(instanceName, remoteJid, `${finalContent}\n\n${optionsText}`);
        } else {
          await whatsappService.sendMessage(instanceName, remoteJid, finalContent);
        }
        
        const newMsg = await prisma.message.create({
          data: {
            conversationId,
            body: node.type === 'LIST' ? `[LISTA: ${finalContent}]` : finalContent,
            fromMe: true,
            type: 'chat'
          }
        });
        await broadcastMessage(newMsg.id);
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
        const newMsg = await prisma.message.create({
          data: { conversationId, body: node.content, fromMe: true, type: 'chat' }
        });
        await broadcastMessage(newMsg.id);
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

  async triggerFlow(flowId: string, conversationId: string, instanceName: string, remoteJid: string): Promise<void> {
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
