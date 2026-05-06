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
      const normalizedInput = (text || '').trim().toLowerCase();

      // 🔍 2. Verificação de Gatilho (Trigger) - Pode reiniciar o fluxo a qualquer momento
      // Busca todos os fluxos ativos que podem ser usados por esta instância
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

      // Tenta encontrar um fluxo que tenha a palavra-chave nos gatilhos
      let targetFlow = activeFlows.find(f => {
        const keywords = f.triggerKeywords?.split(',').map(k => k.trim().toLowerCase()).filter(k => k !== '') || [];
        return keywords.includes(normalizedInput);
      });

      if (targetFlow) {
        console.log(`[BotEngine] ✅ Gatilho detectado ("${normalizedInput}"). Iniciando/Reiniciando fluxo: ${targetFlow.name}`);
        const firstNode = targetFlow.nodes[0];
        
        // Atualiza a conversa
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

      // 3. Se não tem fluxo em andamento e não pegou gatilho, tenta o fluxo padrão (isDefault)
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
      if (currentNode.type === 'MENU' || currentNode.type === 'LIST') {
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

    if (node.type === 'MESSAGE' || node.type === 'MENU' || node.type === 'LIST') {
      // Envia a mensagem do nó
      if (node.content) {
        let finalContent = node.content;

        // 📝 Substituição de Variáveis Dinâmicas
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { contact: true }
        });
        
        if (conversation?.contact?.name) {
          finalContent = finalContent.replace(/\{\{nome\}\}/gi, conversation.contact.name);
          finalContent = finalContent.replace(/\{\{name\}\}/gi, conversation.contact.name);
        }
        
        // Se for um nó de LISTA (WhatsApp List Message)
        if (node.type === 'LIST' && node.options && node.options.length > 0) {
          try {
            await whatsappService.sendListMessage(instanceName, remoteJid, {
              title: "Opções Disponíveis",
              description: node.content,
              buttonText: "Ver Opções",
              footer: "Escolha uma opção acima",
              sections: [{
                title: "Menu principal",
                rows: node.options.map((opt: any) => ({
                  title: opt.label,
                  description: `Escolha ${opt.label}`,
                  rowId: opt.keyword
                }))
              }]
            });
          } catch (err) {
            // Fallback para menu texto se der erro na lista
            const optionsText = node.options
              .map((opt: any) => `*${opt.keyword}* - ${opt.label}`)
              .join('\n');
            finalContent = `${node.content}\n\n${optionsText}`;
            await whatsappService.sendMessage(instanceName, remoteJid, finalContent);
          }
        } 
        // Se for um menu de TEXTO padrão
        else if (node.type === 'MENU' && node.options && node.options.length > 0) {
          const optionsText = node.options
            .map((opt: any) => `*${opt.keyword}* - ${opt.label}`)
            .join('\n');
          finalContent = `${node.content}\n\n${optionsText}`;
          await whatsappService.sendMessage(instanceName, remoteJid, finalContent);
        } else {
          await whatsappService.sendMessage(instanceName, remoteJid, finalContent);
        }
        
        // Salva no banco com o conteúdo completo
        await prisma.message.create({
          data: {
            conversationId,
            body: node.type === 'LIST' ? `[LISTA: ${node.content}]` : finalContent,
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
    else if (node.type === 'TRANSFER' || node.routingDepartmentId) {
      // Envia aviso de transferência se houver conteúdo
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

      // Desliga o bot e manda pra fila do setor correspondente
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
      
      console.log(`[BotEngine] 🚩 Conversa ${conversationId} roteada para o setor: ${node.routingDepartmentId || 'Geral'}`);
    }
  }
};
