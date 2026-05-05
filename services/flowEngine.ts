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
  }
};
