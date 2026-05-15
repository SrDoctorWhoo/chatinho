import { prisma } from '../prisma';
import { botEngine } from '../botEngine';
import { resolveConnectedInstanceForConversation } from '../instanceResolver';

/**
 * Verifica se existe um fluxo configurado para disparar ao entrar em um departamento
 * e o executa caso encontre.
 */
export async function checkAndTriggerDepartmentFlow(conversationId: string, departmentId: string) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation) return false;

    const triggerFlow = await prisma.chatbotFlow.findFirst({
      where: { 
        triggerDepartmentId: departmentId,
        isActive: true 
      }
    });

    if (triggerFlow) {
      const instance = await resolveConnectedInstanceForConversation({
        departmentId: departmentId,
        platform: conversation.platform as any
      });

      if (instance) {
        const remoteJid = conversation.platform === 'TELEGRAM' 
          ? conversation.contact.number 
          : `${conversation.contact.number}@s.whatsapp.net`;

        console.log(`[TriggerHandler] Disparando fluxo "${triggerFlow.name}" para ${remoteJid} no setor ${departmentId}`);
        await botEngine.triggerFlow(triggerFlow.id, {
          conversationId,
          instanceName: instance.name,
          remoteJid,
          platform: conversation.platform,
          variables: JSON.parse(conversation.variables || '{}')
        });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('[TriggerHandler] Erro ao verificar gatilho de departamento:', error);
    return false;
  }
}
