import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export class MediaService {
  static async downloadMedia(instanceName: string, messageData: any, messageType: string): Promise<string | null> {
    const mediaData = messageData.message?.imageMessage || 
                     messageData.message?.audioMessage || 
                     messageData.message?.pttMessage ||
                     messageData.message?.videoMessage || 
                     messageData.message?.documentMessage;
    
    const originalUrl = mediaData?.url || null;
    if (!originalUrl) return null;

    const maxRetries = 3;
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < maxRetries; i++) {
      try {
        const messageId = messageData.key?.id;
        console.log(`[MediaService] Tentativa ${i + 1} de download: ${messageId} via ${instanceName}`);
        
        // Pequeno delay na primeira tentativa, maior nas seguintes
        if (i > 0) await delay(1500 * i);
        else await delay(500);

        const endpoint = `${process.env.EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.EVOLUTION_API_KEY || ''
          },
          body: JSON.stringify({
            message: messageData, // Envia o objeto completo (key + message)
            convertToMp4: false
          })
        });

        if (response.ok) {
          const data = await response.json();
          const base64 = data.base64 || data.data?.base64;
          
          if (base64 && base64.length > 10) { // Verifica se veio algo substancial
            const buffer = Buffer.from(base64, 'base64');
            
            if (buffer.length > 0) {
              const extension = messageType === 'image' ? 'jpg' : 
                               messageType === 'audio' ? 'ogg' : 
                               messageType === 'video' ? 'mp4' : 'bin';
              
              const fileName = `received-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;
              const uploadDir = path.join(process.cwd(), 'public', 'uploads');
              
              if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
              fs.writeFileSync(path.join(uploadDir, fileName), buffer);
              
              console.log(`[MediaService] Download concluído: /uploads/${fileName} (${buffer.length} bytes)`);
              return `/uploads/${fileName}`;
            }
          }
          console.warn(`[MediaService] Tentativa ${i + 1}: Base64 vazio ou inválido recebido.`);
        } else {
          const error = await response.text();
          console.warn(`[MediaService] Tentativa ${i + 1} falhou: ${response.status} - ${error}`);
        }
      } catch (err: any) {
        console.error(`[MediaService] Erro na tentativa ${i + 1}: ${err.message}`);
      }
    }

    console.error(`[MediaService] Todas as tentativas falharam para ${messageData.key?.id}. Mantendo URL original.`);
    // Fallback para URL original se download falhar após retries
    return originalUrl;
  }
}
