import { prisma } from '../prisma';

export function replaceVars(text: string, variables: Record<string, any>) {
  if (!text) return text;
  let newStr = text;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
    const val = typeof variables[key] === 'object' ? JSON.stringify(variables[key]) : variables[key];
    newStr = newStr.replace(regex, val);
  });
  return newStr;
}

export async function getBotSettings() {
  return await prisma.systemSettings.findUnique({ where: { id: 'global' } });
}

export async function getActiveFlows(instanceName: string) {
  return await prisma.chatbotFlow.findMany({
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
}
