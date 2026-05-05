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

      // Evitar que o bot responda mensagens que enviamos (quando o atendente assume e a flag falhou, etc)
      // O chamador deve garantir que `processMessage` só seja chamada para mensagens de clientes.

      let currentFlowId = conversation.currentFlowId;
      let currentStepId = conversation.currentStepId;

      // 2. Se não tem fluxo, tenta achar o fluxo padrão ou o primeiro ativo
      if (!currentFlowId) {
        let defaultFlow = await prisma.chatbotFlow.findFirst({
          where: { isActive: true, isDefault: true },
          include: {
            nodes: {
              orderBy: { id: 'asc' },
              include: { options: true }
            }
          }
        });

        // Se não tem padrão, pega o primeiro ativo que encontrar
        if (!defaultFlow) {
          defaultFlow = await prisma.chatbotFlow.findFirst({
            where: { isActive: true },
            include: {
              nodes: {
                orderBy: { id: 'asc' },
                include: { options: true }
              }
            }
          });
        }

        if (!defaultFlow || !defaultFlow.nodes || defaultFlow.nodes.length === 0) {
          console.log('[BotEngine] Nenhum fluxo ativo com nós encontrado.');
          return;
        }

        // 🔍 Verificação de Gatilho (Trigger)
        const normalizedInput = (text || '').trim().toLowerCase();
        console.log(`[BotEngine] Buscando fluxo para gatilho: "${normalizedInput}"`);
        const keywords = defaultFlow.triggerKeywords?.split(',').map(k => k.trim().toLowerCase()).filter(k => k !== '') || [];
        console.log(`[BotEngine] Gatilhos configurados no fluxo "${defaultFlow.name}": [${keywords.join(', ')}]`);

        // Se tem palavras-chave definidas e a mensagem não bate com nenhuma, ignora
        if (keywords.length > 0 && !keywords.includes(normalizedInput)) {
          console.log(`[BotEngine] ✋ Ignorando: "${text}" não bate com nenhum gatilho.`);
          return;
        }

        console.log(`[BotEngine] ✅ Gatilho aceito! Iniciando fluxo: ${defaultFlow.name}`);

        const firstNode = defaultFlow.nodes[0];
        currentFlowId = defaultFlow.id;
        currentStepId = firstNode.id;

        // Atualiza a conversa para indicar que entrou no bot e ativá-lo
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            currentFlowId,
            currentStepId,
            status: 'BOT',
            isBotActive: true
          }
        });

        // Executa o primeiro nó
        await this.executeNode(firstNode, conversation.id, instanceName, remoteJid);
        return;
      }

      // 3. Se já tem fluxo, busca o nó atual
      const currentNode = await prisma.chatbotNode.findUnique({
        where: { id: currentStepId as string },
        include: { options: true }
      });

      if (!currentNode) {
        // Estado inválido (nó deletado?), reseta
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { currentFlowId: null, currentStepId: null }
        });
        return;
      }

      // 4. Avalia a resposta do usuário baseada no tipo de nó atual
      if (currentNode.type === 'MENU') {
        const options = currentNode.options;
        const normalizedText = (text || '').trim().toLowerCase();
        
        // Procura a opção correspondente (pela keyword)
        const matchedOption = options.find(opt => opt.keyword.trim().toLowerCase() === normalizedText);

        if (matchedOption) {
          // Encontrou a opção, avança para o targetNodeId
          const nextNode = await prisma.chatbotNode.findUnique({
            where: { id: matchedOption.targetNodeId },
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
          // Não encontrou opção, avisa e re-executa o nó de menu (que já formata bonitinho)
          await whatsappService.sendMessage(instanceName, remoteJid, "❌ *Opção inválida.* Por favor, escolha uma das opções abaixo:");
          await this.executeNode(currentNode, conversation.id, instanceName, remoteJid);
        }
      } else if (currentNode.type === 'MESSAGE') {
        // Se estava em MESSAGE esperando resposta (o que é raro num fluxo linear, geralmente MESSAGE tem nextStepId e não para),
        // Se parou num MESSAGE e o usuário digitou, pode ser que esse MESSAGE era o fim da linha.
        // Se tiver nextStepId, já deveria ter executado.
        // Nesse caso, o bot pode não fazer nada, ou recomeçar o fluxo, ou transferir.
        // Vamos manter o bot silencioso se chegou no fim da linha e o cara mandou msg.
      }

    } catch (err) {
      console.error('[BotEngine] Erro ao processar:', err);
    }
  },

  async executeNode(node: any, conversationId: string, instanceName: string, remoteJid: string) {
    if (!node) return;

    if (node.type === 'MESSAGE' || node.type === 'MENU') {
      // Envia a mensagem do nó
      if (node.content) {
        let finalContent = node.content;
        
        // Se for um menu, adiciona as opções formatadas no final
        if (node.type === 'MENU' && node.options && node.options.length > 0) {
          const optionsText = node.options
            .map((opt: any) => `*${opt.keyword}* - ${opt.label}`)
            .join('\n');
          finalContent = `${node.content}\n\n${optionsText}`;
        }

        await whatsappService.sendMessage(instanceName, remoteJid, finalContent);
        
        // Salva no banco com o conteúdo completo
        await prisma.message.create({
          data: {
            conversationId,
            body: finalContent,
            fromMe: true,
            type: 'chat'
          }
        });
      }

      // Atualiza data
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      // Se for MESSAGE e tiver nextStepId, executa imediatamente em cascata
      if (node.type === 'MESSAGE' && node.nextStepId) {
        const nextNode = await prisma.chatbotNode.findUnique({
          where: { id: node.nextStepId },
          include: { options: true }
        });
        
        if (nextNode) {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { currentStepId: nextNode.id }
          });
          
          // Delayzinho pra não mandar tudo grudado de uma vez
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.executeNode(nextNode, conversationId, instanceName, remoteJid);
        }
      }
    } 
    else if (node.type === 'TRANSFER') {
      // Envia aviso de transferência
      if (node.content) {
        await whatsappService.sendMessage(instanceName, remoteJid, node.content);
        
        await prisma.message.create({
          data: {
            conversationId,
            body: node.content,
            fromMe: true,
            type: 'chat'
          }
        });
      }

      // Desliga o bot e manda pra fila humana
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { 
          isBotActive: false,
          status: 'QUEUED',
          currentFlowId: null,
          currentStepId: null,
          lastMessageAt: new Date()
        }
      });
    }
  }
};
