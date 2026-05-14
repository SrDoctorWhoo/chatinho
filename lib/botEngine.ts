import { prisma } from './prisma';
import { aiProcessor } from './bot/aiProcessor';
import { nodeProcessor } from './bot/nodeProcessor';
import { getActiveFlows, getBotSettings } from './bot/utils';
import { BotContext } from './bot/types';

export const botEngine = {
  async buildContext(conversation: any, instanceName: string, remoteJid: string): Promise<BotContext> {
    const variables = JSON.parse(conversation.variables || '{}');
    
    let depsList = '';

    // If we are in a flow, get departments from ALL instances linked to this flow
    if (conversation.currentFlowId) {
      const flow = await prisma.chatbotFlow.findUnique({
        where: { id: conversation.currentFlowId },
        include: { 
          instances: { 
            include: { 
              departments: { select: { name: true } } 
            } 
          } 
        }
      });
      
      if (flow && flow.instances.length > 0) {
        const allDeps = flow.instances.flatMap(inst => inst.departments.map(d => d.name));
        depsList = Array.from(new Set(allDeps)).join(', ');
      }
    }

    // Fallback or override: if still empty, get from the current instance receiving the message
    if (!depsList) {
      const instance = await prisma.whatsappInstance.findUnique({
        where: { name: instanceName },
        include: { departments: { select: { name: true } } }
      });
      depsList = instance?.departments.map(d => d.name).join(', ') || '';
    }
    
    // Force identity from contact OR remoteJid
    const rawNumber = conversation.contact?.number || remoteJid.split('@')[0] || '';
    
    // Check if this is truly the first interaction for this contact in this conversation
    const messageCount = await prisma.message.count({
      where: { conversationId: conversation.id }
    });

    variables.nome = conversation.contact?.name || 'Cliente';
    variables.name = variables.nome;
    variables.telefone = rawNumber;
    variables.number = rawNumber;
    variables.departamentos = depsList;
    variables.platform = conversation.platform;
    variables.protocol = conversation.protocol;
    variables.remoteJid = remoteJid;
    variables.instanceName = instanceName;
    variables.is_first_interaction = messageCount <= 1 ? 'true' : 'false';

    return { 
      conversationId: conversation.id, 
      instanceName, 
      remoteJid, 
      platform: conversation.platform as any, 
      variables 
    };
  },

  async processMessage(conversationId: string, text: string, instanceName: string, remoteJid: string) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { contact: true }
      });

      if (!conversation || conversation.status === 'CLOSED') return;

      const context = await this.buildContext(conversation, instanceName, remoteJid);

      // 2. Check for keyword triggers if bot is active
      if (conversation.isBotActive) {
        const activeFlows = await prisma.chatbotFlow.findMany({
          where: { isActive: true },
          include: { nodes: { include: { options: true } } }
        });

        const matchedFlow = activeFlows.find(f => 
          f.triggerKeywords?.split(',').map(k => k.trim().toLowerCase()).includes(text.toLowerCase())
        );

        if (matchedFlow) {
          return this.triggerFlow(matchedFlow.id, conversationId, instanceName, remoteJid);
        }
      }

      // 3. Handle current step if in flow
      if (conversation.currentStepId) {
        const currentNode = await prisma.chatbotNode.findUnique({
          where: { id: conversation.currentStepId },
          include: { options: true }
        });

        if (currentNode) {
          // If it's a MENU or LIST, check options
          if (currentNode.type === 'MENU' || currentNode.type === 'LIST') {
             const matchedOption = currentNode.options.find(opt => 
               opt.keyword.toLowerCase() === text.toLowerCase() || 
               opt.label.toLowerCase() === text.toLowerCase()
             );

             if (matchedOption) {
                if (matchedOption.targetFlowId) {
                   return this.triggerFlow(matchedOption.targetFlowId, conversationId, instanceName, remoteJid);
                }
                if (matchedOption.targetNodeId) {
                   await prisma.conversation.update({
                     where: { id: conversationId },
                     data: { currentStepId: matchedOption.targetNodeId }
                   });
                   return this.executeNode(matchedOption.targetNodeId, context);
                }
             }
          }

          // 🚀 SE FOR WAIT_INPUT, SALVA O TEXTO NA VARIÁVEL
          if (currentNode.type === 'WAIT_INPUT' && currentNode.variableName) {
            const currentVars = JSON.parse(conversation.variables || '{}');
            currentVars[currentNode.variableName] = text;
            
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { variables: JSON.stringify(currentVars) }
            });

            // Se tiver um próximo passo, avança automaticamente
            if (currentNode.nextStepId) {
              await prisma.conversation.update({
                where: { id: conversationId },
                data: { currentStepId: currentNode.nextStepId }
              });
              const nextContext = { ...context, variables: currentVars };
              return this.executeNode(currentNode.nextStepId, nextContext);
            }
          }

          // Re-execute current node (e.g. for AI or WAIT_INPUT)
          return this.executeNode(currentNode, context);
        }
      }

      // 4. Fallback to Welcome Flow if no active flow
      if (!conversation.currentFlowId && conversation.isBotActive) {
        const settings = await prisma.systemSettings.findUnique({ where: { id: 'global' } });
        const welcomeFlow = await prisma.chatbotFlow.findFirst({
           where: { id: settings?.welcomeFlowId || undefined, isActive: true },
           include: { nodes: { include: { options: true } } }
        }) || await prisma.chatbotFlow.findFirst({
           where: { isDefault: true, isActive: true },
           include: { nodes: { include: { options: true } } }
        });

        if (welcomeFlow && welcomeFlow.nodes.length > 0) {
          return this.triggerFlow(welcomeFlow.id, conversationId, instanceName, remoteJid);
        }
      }

    } catch (err) {
      console.error('[BotEngine] processMessage Error:', err);
    }
  },

  async executeNode(nodeOrId: any, context: BotContext) {
    try {
      const node = typeof nodeOrId === 'string' 
        ? await prisma.chatbotNode.findUnique({ where: { id: nodeOrId }, include: { options: true } })
        : nodeOrId;

      if (!node) return;

      if (node.type === 'AI_DIFY') {
        return aiProcessor.process(node, context);
      } else {
        return nodeProcessor.process(node, context, this);
      }
    } catch (err) {
      console.error('[BotEngine] executeNode Error:', err);
    }
  },

  async triggerFlow(flowId: string, conversationId: string, instanceName: string, remoteJid: string) {
    const flow = await prisma.chatbotFlow.findUnique({
      where: { id: flowId },
      include: { nodes: { orderBy: { id: 'asc' }, include: { options: true } } }
    });

    if (!flow || flow.nodes.length === 0) return;

    const firstNode = flow.nodes[0];
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        currentFlowId: flow.id,
        currentStepId: firstNode.id,
        status: 'BOT',
        isBotActive: true
      },
      include: { contact: true }
    });

    const context = await this.buildContext(conversation, instanceName, remoteJid);
    return this.executeNode(firstNode, context);
  }
};
