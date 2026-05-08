import { prisma } from '@/lib/prisma';
import { whatsappService } from '@/lib/whatsapp';

export const flowEngine = {
  async processMessage(conversationId: string, messageText: string, instanceName: string) {
    console.log(`[Bot] Processando mensagem para conversa ${conversationId}: "${messageText}"`);
    
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation || !conversation.isBotActive || conversation.status !== 'BOT') {
      console.log(`[Bot] Automação ignorada: isBotActive=${conversation?.isBotActive}, status=${conversation?.status}`);
      return;
    }

    let nextNode = null;
    const currentNodeId = conversation.currentStepId;

    if (!currentNodeId) {
      // Início do fluxo: busca fluxo padrão
      const defaultFlow = await prisma.chatbotFlow.findFirst({
        where: { isDefault: true, isActive: true },
        include: { nodes: { orderBy: { id: 'asc' }, take: 1 } }
      });

      if (defaultFlow && defaultFlow.nodes.length > 0) {
        nextNode = defaultFlow.nodes[0];
      }
    } else {
      // Já está em um nó, busca opções
      const options = await prisma.chatbotOption.findMany({
        where: { nodeId: currentNodeId }
      });

      const selectedOption = options.find(opt => 
        opt.keyword.toLowerCase() === messageText.trim().toLowerCase() ||
        messageText.trim().toLowerCase() === opt.label.toLowerCase()
      );

      if (selectedOption) {
        nextNode = await prisma.chatbotNode.findUnique({
          where: { id: selectedOption.targetNodeId }
        });
      } else {
        // Se não houver opção, tenta seguir para o próximo passo linear se for do tipo MESSAGE
        const currentNode = await prisma.chatbotNode.findUnique({
          where: { id: currentNodeId }
        });

        // --- LÓGICA DE IA DINÂMICA ---
        if (currentNode?.type === 'AI_DIFY' && currentNode.integrationId) {
          console.log(`[Bot] Nó atual é IA. Buscando integração...`);
          
          const integration = await prisma.externalIntegration.findUnique({
            where: { id: currentNode.integrationId }
          });
          
          if (integration?.isActive) {
            let answer = '';

            if (integration.type === 'DIFY') {
              const aiResponse = await this.callDify(
                integration.apiKey || '',
                integration.baseUrl || 'https://api.dify.ai/v1',
                messageText,
                conversation.id,
                conversation.difyConversationId
              );
              if (aiResponse) {
                answer = aiResponse.answer;
                // Atualiza o contexto da IA
                await prisma.conversation.update({
                  where: { id: conversation.id },
                  data: { difyConversationId: aiResponse.conversation_id }
                });
              }
            } else if (integration.type === 'WEBHOOK') {
              const method = integration.method || 'POST';
              let url = integration.baseUrl || '';
              let options: any = {
                method,
                headers: { 'Content-Type': 'application/json' },
              };

              const payload = {
                contact: {
                  name: conversation.contact.name,
                  number: conversation.contact.number
                },
                message: messageText,
                conversationId: conversation.id
              };

              if (method === 'GET') {
                const params = new URLSearchParams({
                  name: payload.contact.name,
                  number: payload.contact.number,
                  message: payload.message,
                  conversationId: payload.conversationId
                });
                url = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;
              } else {
                options.body = JSON.stringify(payload);
              }

              const response = await fetch(url, options);
              if (response.ok) {
                const data = await response.json();
                answer = data.answer;
              }
            } else if (integration.type === 'OPENAI') {
              const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${integration.apiKey}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  model: 'gpt-3.5-turbo',
                  messages: [{ role: 'user', content: messageText }]
                })
              });
              if (response.ok) {
                const data = await response.json();
                answer = data.choices[0].message.content;
              }
            }

            if (answer) {
              const instance = await prisma.whatsappInstance.findFirst({
                where: { name: instanceName }
              });

              if (instance) {
                await whatsappService.sendMessage(instance.instanceId, conversation.contact.number, answer);
                
                await prisma.message.create({
                  data: {
                    conversationId: conversation.id,
                    body: answer,
                    fromMe: true,
                    type: 'chat'
                  }
                });
                return;
              }
            }
          }
        }
        // --- FIM LÓGICA IA ---
        
        if (currentNode?.nextStepId) {
          nextNode = await prisma.chatbotNode.findUnique({
            where: { id: currentNode.nextStepId }
          });
        } else {
          // Opcional: Mandar mensagem de "Opção inválida" ou repetir o nó atual
          console.log(`[Bot] Nenhuma opção correspondente encontrada para "${messageText}"`);
          // Repetir o nó atual para ajudar o usuário
          nextNode = currentNode;
        }
      }
    }

    if (nextNode) {
      await this.executeNode(instanceName, conversation, nextNode);
    }
  },

  async executeNode(instanceName: string, conversation: any, node: any) {
    try {
      // 1. Prepara e envia a mensagem
      let fullText = node.content;
      
      // Se tiver opções, anexa ao texto para facilitar a visualização do usuário
      const options = await prisma.chatbotOption.findMany({ where: { nodeId: node.id } });
      if (options.length > 0) {
        fullText += '\n\n' + options.map(opt => `*${opt.keyword}* - ${opt.label}`).join('\n');
      }

      // Busca a instância real pelo nome (instanceName vindo do webhook)
      const instance = await prisma.whatsappInstance.findFirst({
        where: { name: instanceName }
      });

      if (!instance) {
        console.error(`[Bot] Instância ${instanceName} não encontrada no banco.`);
        return;
      }

      await whatsappService.sendMessage(instance.instanceId, conversation.contact.number, fullText);

      // 2. Salva a mensagem no banco
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          body: fullText,
          fromMe: true,
          type: 'chat'
        }
      });

      // 3. Atualiza o estado da conversa
      const updateData: any = {
        currentStepId: node.id,
        lastMessageAt: new Date(),
        status: node.type === 'TRANSFER' ? 'QUEUED' : 'BOT',
        isBotActive: node.type !== 'TRANSFER'
      };

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: updateData
      });

      // 4. Se for transferência, notifica via Socket (opcional aqui, o webhook já deve notificar)
      if (node.type === 'TRANSFER') {
        console.log(`[Bot] Cliente ${conversation.contact.number} movido para a FILA.`);
      }

      // 5. Se for nó linear de mensagem, pula para o próximo automaticamente após um delay
      if (node.type === 'MESSAGE' && node.nextStepId) {
        const nextLinearNode = await prisma.chatbotNode.findUnique({
          where: { id: node.nextStepId }
        });
        if (nextLinearNode) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          await this.executeNode(instanceName, conversation, nextLinearNode);
        }
      }
    } catch (error) {
      console.error(`[Bot] Erro ao executar nó ${node.id}:`, error);
    }
  },

  async callDify(apiKey: string, baseUrl: string, query: string, userId: string, conversationId?: string | null) {
    try {
      const response = await fetch(`${baseUrl}/chat-messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {},
          query,
          response_mode: 'blocking',
          user: userId,
          conversation_id: conversationId || undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Dify API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Dify] Error calling Dify API:', error);
      return null;
    }
  }
};
