import axios from 'axios';
import { prisma } from './prisma';
import { telegramService } from './telegram';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

const evolution = axios.create({
  baseURL: EVOLUTION_API_URL,
  timeout: 30000,
  headers: {
    apikey: EVOLUTION_API_KEY,
    'Content-Type': 'application/json',
  },
});

export const whatsappService = {
  async getInstances() {
    try {
      const response = await evolution.get('/instance/fetchInstances');
      return response.data;
    } catch (error) {
      console.error('[Evolution] Erro ao buscar instancias:', error);
      return [];
    }
  },

  async createInstance(instanceName: string) {
    try {
      const response = await evolution.post('/instance/create', {
        instanceName,
        token: '',
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      });
      return response.data;
    } catch (error: any) {
      console.error('[Evolution] Erro ao criar instancia:', error.response?.data || error.message);
      throw error;
    }
  },

  async createCloudInstance(instanceName: string, config: { token: string; businessId: string; number: string }) {
    try {
      const response = await evolution.post('/instance/create', {
        instanceName,
        token: config.token,
        number: config.number,
        businessId: config.businessId,
        integration: 'WHATSAPP-BUSINESS',
      });
      return response.data;
    } catch (error: any) {
      console.error('[Evolution] Erro ao criar instancia Cloud:', error.response?.data || error.message);
      throw error;
    }
  },

  async deleteInstance(instanceName: string) {
    try {
      await evolution.delete(`/instance/delete/${instanceName}`);
      return true;
    } catch (error: any) {
      console.error('[Evolution] Erro ao deletar instancia:', error.response?.data || error.message);
      return false;
    }
  },

  async getSessionStatus(instanceId: string) {
    try {
      const response = await evolution.get(`/instance/connectionState/${instanceId}`);
      return response.data;
    } catch {
      return null;
    }
  },

  async getProfilePictureUrl(instanceId: string, remoteJid: string) {
    try {
      const response = await evolution.get(`/chat/fetchProfilePictureUrl/${instanceId}`, {
        params: { number: remoteJid },
      });
      return response.data?.profilePictureUrl || null;
    } catch {
      console.log(`[Evolution] Foto de perfil indisponivel para ${remoteJid}`);
      return null;
    }
  },

  async initSession(instanceId: string) {
    try {
      console.log(`[Evolution] Buscando QR Code para ${instanceId}...`);
      const connectResponse = await evolution.get(`/instance/connect/${instanceId}`);

      let qrBase64 =
        connectResponse.data?.base64 ||
        connectResponse.data?.code ||
        connectResponse.data?.qrcode?.base64 ||
        connectResponse.data?.instance?.qrcode?.base64;

      if (!qrBase64) {
        const stateRes = await evolution.get(`/instance/connectionState/${instanceId}`);
        qrBase64 = stateRes.data?.instance?.qrcode?.base64 || stateRes.data?.instance?.qrcode;
      }

      if (qrBase64) {
        await prisma.whatsappInstance.update({
          where: { instanceId },
          data: {
            qrcode: qrBase64.includes('base64') ? qrBase64 : `data:image/png;base64,${qrBase64}`,
            status: 'QRCODE',
          },
        });
        return true;
      }

      return false;
    } catch (error: any) {
      console.error(`[Evolution] Erro ao iniciar sessao ${instanceId}:`, error.response?.data || error.message);
      return false;
    }
  },

  async sendMessage(instanceId: string, number: string, text: string) {
    try {
      const instance = await prisma.whatsappInstance.findUnique({
        where: { instanceId },
      });

      if (!instance) {
        throw new Error(`Instância "${instanceId}" não encontrada.`);
      }

      const integrationType = String(instance.integration || '').toUpperCase();

      if (integrationType === 'TELEGRAM') {
        if (!instance.token) {
          throw new Error('Token do Telegram não configurado para esta instância.');
        }

        return telegramService.sendMessage(instance.token, String(number).trim(), text);
      }

      let cleanNumber = number.replace(/\D/g, '');
      const targetNumber =
        instance?.integration === 'WHATSAPP-BUSINESS'
          ? cleanNumber
          : number.includes('@')
          ? number
          : `${cleanNumber}@s.whatsapp.net`;

      const payload: Record<string, unknown> = {
        number: targetNumber,
        text,
        linkPreview: false,
      };

      if (instance?.integration !== 'WHATSAPP-BUSINESS') {
        payload.delay = 1200;
        payload.presence = 'composing';
      }

      const response = await evolution.post(`/message/sendText/${instanceId}`, payload);
      return response.data;
    } catch (err: any) {
      console.error(`[Canal] Erro ao enviar mensagem (${instanceId}):`, err.response?.data || err.message);
      const detail = err.response?.data?.message || err.message || 'Erro desconhecido';
      throw new Error(detail);
    }
  },

  async sendListMessage(
    instanceId: string,
    number: string,
    data: { title: string; description: string; buttonText: string; footer: string; sections: any[] }
  ) {
    try {
      const instance = await prisma.whatsappInstance.findUnique({ where: { instanceId } });

      if (instance?.integration === 'TELEGRAM') {
        if (!instance.token) {
          throw new Error('Token do Telegram nao configurado para esta instancia.');
        }

        const rowsText = data.sections
          ?.flatMap((section: any) =>
            (section.rows || []).map((row: any) => `- ${row.title}${row.description ? `: ${row.description}` : ''} (${row.rowId})`)
          )
          .join('\n');

        const fallbackText = [data.title || 'Opcoes', data.description || '', rowsText || '', data.footer || '']
          .filter(Boolean)
          .join('\n\n');

        return telegramService.sendMessage(instance.token, String(number).trim(), fallbackText);
      }

      const cleanNumber = number.replace(/\D/g, '');
      const targetNumber =
        instance?.integration === 'WHATSAPP-BUSINESS'
          ? cleanNumber
          : number.includes('@')
          ? number
          : `${cleanNumber}@s.whatsapp.net`;

      const payload = {
        number: targetNumber,
        title: (data.title || 'Menu').substring(0, 50).trim(),
        description: (data.description || 'Escolha uma opcao').substring(0, 1024).trim(),
        buttonText: (data.buttonText || 'Ver Opcoes').substring(0, 20).trim(),
        footer: (data.footer || '').substring(0, 50).trim(),
        sections: data.sections?.map((section: any) => ({
          title: (section.title || 'Menu').substring(0, 24).trim(),
          rows: section.rows?.map((row: any) => {
            const finalRow: Record<string, string> = {
              title: (row.title || 'Opcao').substring(0, 24).trim(),
              rowId: String(row.rowId || Math.random()).trim(),
            };

            if (row.description && row.description.trim()) {
              finalRow.description = row.description.substring(0, 72).trim();
            }

            return finalRow;
          }),
        })),
      };

      const response = await evolution.post(`/message/sendList/${instanceId}`, payload);
      return response.data;
    } catch (err: any) {
      console.error('[Canal] Erro ao enviar lista:', err.response?.data || err.message);
      throw err;
    }
  },

  async logout(instanceId: string) {
    try {
      await evolution.delete(`/instance/logout/${instanceId}`);
      await prisma.whatsappInstance.update({
        where: { instanceId },
        data: { status: 'DISCONNECTED', qrcode: null },
      });
      return true;
    } catch (err: any) {
      console.error('[Evolution] Erro ao deslogar:', err.response?.data || err.message);
      return false;
    }
  },

  async setWebhook(instanceId: string) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.NEXTAUTH_URL;
      const webhookUrl = `${baseUrl}/api/webhook/whatsapp`;
      console.log(`[Evolution] Configurando webhook para ${instanceId} -> ${webhookUrl}`);

      const response = await evolution.post(`/webhook/set/${instanceId}`, {
        webhook: {
          url: webhookUrl,
          enabled: true,
          webhookByEvents: false,
          webhookBase64: true,
          events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('[Evolution] Erro ao configurar webhook:', error.response?.data || error.message);
      return null;
    }
  },

  async updateMetaSettings(instanceName: string, config: { token: string; phoneNumberId: string; wabaId: string }) {
    try {
      console.log(`[Evolution] Atualizando configuracoes Meta para ${instanceName} (Delete + Create)...`);

      try {
        await evolution.delete(`/instance/delete/${instanceName}`);
      } catch {
        console.log(`[Evolution] Instancia ${instanceName} nao precisou ser deletada.`);
      }

      const response = await evolution.post('/instance/create', {
        instanceName,
        token: config.token,
        phoneNumberId: config.phoneNumberId,
        wabaId: config.wabaId,
        integration: 'WHATSAPP-BUSINESS',
      });

      await this.setWebhook(instanceName);

      return response.data;
    } catch (error: any) {
      console.error('[Evolution] Erro ao atualizar configuracoes Meta:', error.response?.data || error.message);
      throw error;
    }
  },
};

export const evolutionService = whatsappService;
