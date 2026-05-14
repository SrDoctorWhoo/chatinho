import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveConnectedInstanceForConversation } from '@/lib/instanceResolver';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Iniciando verificação de ociosidade por setor...');

    // 1. Busca todos os setores que têm tempo de ociosidade configurado
    const departments = await prisma.department.findMany({
      where: {
        idleTimeout: { not: null, gt: 0 }
      }
    });

    if (departments.length === 0) {
      return NextResponse.json({ message: 'Nenhum setor com ociosidade configurada.' });
    }

    let closedCount = 0;
    const now = new Date();

    for (const dept of departments) {
      const timeoutMinutes = dept.idleTimeout!;
      const expirationDate = new Date(now.getTime() - timeoutMinutes * 60 * 1000);

      // 2. Busca conversas abertas (não CLOSED) no setor que estão ociosas
      const idleConversations = await prisma.conversation.findMany({
        where: {
          departmentId: dept.id,
          status: { in: ['ACTIVE', 'PENDING', 'BOT'] },
          lastMessageAt: { lt: expirationDate }
        },
        include: {
          contact: true
        }
      });

      console.log(`[Cron] Setor "${dept.name}": ${idleConversations.length} conversas ociosas.`);

      for (const conv of idleConversations) {
        try {
          // 3. Envia mensagem de encerramento se configurada
          if (dept.idleCloseMessage) {
            const platform = String(conv.platform || '').toUpperCase() === 'TELEGRAM' ? 'TELEGRAM' : 'WHATSAPP';
            const instance = await resolveConnectedInstanceForConversation({
              departmentId: conv.departmentId,
              platform: platform as any,
            });

            if (instance) {
              // Chama o servidor background para enviar a mensagem
              await fetch('http://localhost:3002/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  instanceId: instance.instanceId,
                  number: conv.contact.number,
                  text: dept.idleCloseMessage
                })
              });

              // Salva a mensagem no banco
              await prisma.message.create({
                data: {
                  conversationId: conv.id,
                  body: dept.idleCloseMessage,
                  fromMe: true
                }
              });
            }
          }

          // 4. Fecha a conversa no banco
          await prisma.conversation.update({
            where: { id: conv.id },
            data: {
              status: 'CLOSED',
              closedAt: now,
              updatedAt: now
            }
          });

          // 5. Notifica o socket para remover da tela dos atendentes
          try {
            const socketUrl = process.env.SOCKET_URL || 'http://127.0.0.1:3000';
            const notifyUrl = `${socketUrl.replace(/\/$/, '')}/api/internal/notify-socket`;
            
            await fetch(notifyUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'conversation_updated',
                data: {
                  conversationId: conv.id,
                  status: 'CLOSED'
                }
              })
            });
          } catch (err) {
            console.error('[Cron] Erro ao notificar socket:', err);
          }

          closedCount++;
        } catch (convErr) {
          console.error(`[Cron] Erro ao fechar conversa ${conv.id}:`, convErr);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Verificação concluída. ${closedCount} conversas encerradas por ociosidade.`,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('[Cron] Erro fatal no check-idle:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
