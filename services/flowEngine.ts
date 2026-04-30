import { prisma } from '@/lib/prisma';
import { evolutionService } from '@/lib/evolution';

export const flowEngine = {
  async processMessage(conversationId: string, messageText: string, instanceName: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation || !conversation.isBotActive) return;

    let currentNodeId = conversation.currentStepId;
    let nextNodeId = null;

    // 1. If we are in a step, check for options match
    if (currentNodeId) {
      const options = await prisma.chatbotOption.findMany({
        where: { nodeId: currentNodeId }
      });

      const matchedOption = options.find(opt => 
        messageText.trim().toLowerCase() === opt.keyword.toLowerCase() ||
        messageText.trim() === opt.label
      );

      if (matchedOption) {
        nextNodeId = matchedOption.targetNodeId;
      } else {
        // Optional: Send "Invalid option" or repeat the current node
        // For now, we'll just repeat or do nothing
        nextNodeId = currentNodeId; 
      }
    } else {
      // 2. No current step, find default flow
      const defaultFlow = await prisma.chatbotFlow.findFirst({
        where: { isDefault: true, isActive: true },
        include: { nodes: true }
      });

      if (defaultFlow && defaultFlow.nodes.length > 0) {
        // Start with the first node (assuming first in array for now)
        nextNodeId = defaultFlow.nodes[0].id;
      }
    }

    if (nextNodeId) {
      const nextNode = await prisma.chatbotNode.findUnique({
        where: { id: nextNodeId },
        include: { options: true }
      });

      if (nextNode) {
        // Send message content
        let fullText = nextNode.content;
        
        // Append options to text if it's a menu
        if (nextNode.options.length > 0) {
          fullText += '\n\n' + nextNode.options.map(opt => `${opt.keyword}. ${opt.label}`).join('\n');
        }

        await evolutionService.sendMessage(instanceName, conversation.contact.number, fullText);

        // Update conversation state
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            currentStepId: nextNode.id,
            status: nextNode.type === 'TRANSFER' ? 'ACTIVE' : 'BOT',
            isBotActive: nextNode.type !== 'TRANSFER'
          }
        });

        // If it's a transfer, we might want to notify attendants
      }
    }
  }
};
