import { prisma } from './prisma';

interface LogOptions {
  userId?: string;
  action: 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE' | 'LOG' | 'SECURITY';
  description: string;
  target?: string;
  ip?: string;
  type?: 'success' | 'info' | 'error' | 'warning';
}

export async function createAuditLog(options: LogOptions) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        description: options.description,
        target: options.target,
        ip: options.ip,
        type: options.type || 'info',
      }
    });
  } catch (err) {
    console.error('[AuditLog] Failed to create log:', err);
  }
}
