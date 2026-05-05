import { prisma } from './prisma';
import axios from 'axios';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

const evolution = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    'apikey': EVOLUTION_API_KEY,
    'Content-Type': 'application/json'
  }
});

export const whatsappService = {
  // Busca todas as instâncias da Evolution API
  async getInstances() {
    try {
      const response = await evolution.get('/instance/fetchInstances');
      return response.data;
    } catch (error) {
      console.error('[Evolution] Erro ao buscar instâncias:', error);
      return [];
    }
  },

  // Cria uma nova instância na Evolution
  async createInstance(instanceName: string) {
    try {
      const response = await evolution.post('/instance/create', {
        instanceName,
        token: '', // Deixa a Evolution gerar um token ou podemos passar um
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true
      });
      return response.data;
    } catch (error: any) {
      console.error('[Evolution] Erro ao criar instância:', error.response?.data || error.message);
      throw error;
    }
  },

  // Deleta uma instância na Evolution
  async deleteInstance(instanceName: string) {
    try {
      await evolution.delete(`/instance/delete/${instanceName}`);
      return true;
    } catch (error: any) {
      console.error('[Evolution] Erro ao deletar instância:', error.response?.data || error.message);
      return false; // Retorna false mas permite deletar localmente se falhar
    }
  },

  async getSessionStatus(instanceId: string) {
    try {
      const response = await evolution.get(`/instance/connectionState/${instanceId}`);
      return response.data;
    } catch (err) {
      return null;
    }
  },

  async getProfilePictureUrl(instanceId: string, remoteJid: string) {
    try {
      const response = await evolution.get(`/chat/fetchProfilePictureUrl/${instanceId}`, {
        params: { number: remoteJid }
      });
      return response.data?.profilePictureUrl || null;
    } catch (err) {
      console.log(`[Evolution] Foto de perfil indisponível para ${remoteJid}`);
      return null;
    }
  },

  // Inicializa uma sessão e busca o QR Code
  async initSession(instanceId: string) {
    try {
      // 1. Tenta pegar o QR Code na conexão
      console.log(`[Evolution] Buscando QR Code para ${instanceId}...`);
      const connectResponse = await evolution.get(`/instance/connect/${instanceId}`);
      
      let qrBase64 = 
        connectResponse.data?.base64 || 
        connectResponse.data?.code || 
        connectResponse.data?.qrcode?.base64 ||
        connectResponse.data?.instance?.qrcode?.base64;

      // 2. Se não veio no connect, tenta no connectionState (algumas versões da v2)
      if (!qrBase64) {
        const stateRes = await evolution.get(`/instance/connectionState/${instanceId}`);
        qrBase64 = stateRes.data?.instance?.qrcode?.base64 || stateRes.data?.instance?.qrcode;
      }

      if (qrBase64) {
        await prisma.whatsappInstance.update({
          where: { instanceId },
          data: { 
            qrcode: qrBase64.includes('base64') ? qrBase64 : `data:image/png;base64,${qrBase64}`, 
            status: 'QRCODE' 
          }
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error(`[Evolution] Erro ao iniciar sessão ${instanceId}:`, error.response?.data || error.message);
      return false;
    }
  },

  async sendMessage(instanceId: string, number: string, text: string) {
    console.log(`[Evolution] Enviando mensagem para ${number} via ${instanceId}`);
    
    let cleanNumber = number.replace(/\D/g, '');
    const remoteJid = number.includes('@') ? number : `${cleanNumber}@s.whatsapp.net`;

    try {
      const response = await evolution.post(`/message/sendText/${instanceId}`, {
        number: remoteJid,
        text: text,
        delay: 1200,
        presence: 'composing',
        linkPreview: false
      });

      return response.data;
    } catch (err: any) {
      console.error(`[Evolution] Erro ao enviar mensagem:`, err.response?.data || err.message);
      throw new Error(err.response?.data?.message || 'Erro ao enviar mensagem via Evolution API');
    }
  },

  async logout(instanceId: string) {
    try {
      await evolution.delete(`/instance/logout/${instanceId}`);
      await prisma.whatsappInstance.update({
        where: { instanceId },
        data: { status: 'DISCONNECTED', qrcode: null }
      });
      return true;
    } catch (err: any) {
      console.error(`[Evolution] Erro ao deslogar:`, err.response?.data || err.message);
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
          events: [
            "MESSAGES_UPSERT",
            "CONNECTION_UPDATE"
          ]
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('[Evolution] Erro ao configurar webhook:', error.response?.data || error.message);
      return null;
    }
  }
};

export const evolutionService = whatsappService;


