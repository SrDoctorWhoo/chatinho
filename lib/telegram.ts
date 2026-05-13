import crypto from 'crypto';

const TELEGRAM_API_BASE_URL = 'https://api.telegram.org';

type TelegramApiEnvelope<T> = {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
};

type TelegramRequestOptions = {
  json?: Record<string, unknown>;
  formData?: FormData;
};

export type TelegramBotIdentity = {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
};

export type TelegramFileInfo = {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
};

function getTelegramMethodUrl(token: string, method: string) {
  return `${TELEGRAM_API_BASE_URL}/bot${token}/${method}`;
}

function getTelegramFileUrl(token: string, filePath: string) {
  return `${TELEGRAM_API_BASE_URL}/file/bot${token}/${filePath}`;
}

function getPublicAppUrl() {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL ||
    '';

  if (!rawBaseUrl) {
    throw new Error('Configure NEXT_PUBLIC_APP_URL, APP_URL ou NEXTAUTH_URL para usar Telegram.');
  }

  const parsedUrl = new URL(rawBaseUrl);
  const invalidHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

  if (parsedUrl.protocol !== 'https:' || invalidHosts.has(parsedUrl.hostname)) {
    throw new Error('Telegram exige um webhook publico em HTTPS. Atualize APP_URL/NEXTAUTH_URL para uma URL publica.');
  }

  return parsedUrl.origin;
}

async function telegramRequest<T>(token: string, method: string, options: TelegramRequestOptions = {}) {
  const headers: HeadersInit = {};
  let body: BodyInit | undefined;

  if (options.formData) {
    body = options.formData;
  } else if (options.json) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  }

  const response = await fetch(getTelegramMethodUrl(token, method), {
    method: 'POST',
    headers,
    body,
  });

  const rawBody = await response.text();
  let parsedBody: TelegramApiEnvelope<T> | null = null;

  try {
    parsedBody = JSON.parse(rawBody) as TelegramApiEnvelope<T>;
  } catch {
    parsedBody = null;
  }

  if (!response.ok || !parsedBody?.ok || parsedBody.result === undefined) {
    const description =
      parsedBody?.description ||
      rawBody ||
      `Telegram API request failed for method ${method}`;

    throw new Error(description);
  }

  return parsedBody.result;
}

function getWebhookSecret(instanceId: string, token: string) {
  const seed = `${process.env.NEXTAUTH_SECRET || 'chatinho'}:${instanceId}:${token}`;
  return crypto.createHash('sha256').update(seed).digest('hex');
}

function getWebhookUrl(instanceId: string) {
  const publicAppUrl = getPublicAppUrl();
  return `${publicAppUrl}/api/webhook/telegram/${encodeURIComponent(instanceId)}`;
}

function getTelegramMediaMethod(mimeType: string, fileName: string) {
  if (mimeType.startsWith('image/')) {
    return { method: 'sendPhoto', fieldName: 'photo' };
  }

  if (mimeType.startsWith('video/')) {
    return { method: 'sendVideo', fieldName: 'video' };
  }

  if (mimeType.startsWith('audio/')) {
    if (mimeType.includes('ogg')) {
      return { method: 'sendVoice', fieldName: 'voice' };
    }

    return { method: 'sendAudio', fieldName: 'audio' };
  }

  if (fileName.toLowerCase().endsWith('.ogg')) {
    return { method: 'sendVoice', fieldName: 'voice' };
  }

  return { method: 'sendDocument', fieldName: 'document' };
}

export const telegramService = {
  async getMe(token: string) {
    return telegramRequest<TelegramBotIdentity>(token, 'getMe');
  },

  async setWebhook(instanceId: string, token: string) {
    const webhookUrl = getWebhookUrl(instanceId);
    const secretToken = getWebhookSecret(instanceId, token);

    await telegramRequest<boolean>(token, 'setWebhook', {
      json: {
        url: webhookUrl,
        secret_token: secretToken,
        allowed_updates: ['message', 'edited_message'],
      },
    });

    return { webhookUrl, secretToken };
  },

  async deleteWebhook(token: string) {
    await telegramRequest<boolean>(token, 'deleteWebhook', {
      json: {
        drop_pending_updates: false,
      },
    });
  },

  async getWebhookInfo(token: string) {
    return telegramRequest<Record<string, unknown>>(token, 'getWebhookInfo');
  },

  async sendMessage(token: string, chatId: string, text: string) {
    return telegramRequest<Record<string, unknown>>(token, 'sendMessage', {
      json: {
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      },
    });
  },

  async sendMedia(
    token: string,
    chatId: string,
    media: { buffer: Buffer; fileName: string; mimeType: string; caption?: string }
  ) {
    const { method, fieldName } = getTelegramMediaMethod(media.mimeType, media.fileName);
    const formData = new FormData();

    formData.append('chat_id', chatId);
    if (media.caption) {
      formData.append('caption', media.caption);
    }

    const blob = new Blob([new Uint8Array(media.buffer)], { type: media.mimeType || 'application/octet-stream' });
    formData.append(fieldName, blob, media.fileName);

    return telegramRequest<Record<string, unknown>>(token, method, { formData });
  },

  async getFile(token: string, fileId: string) {
    return telegramRequest<TelegramFileInfo>(token, 'getFile', {
      json: {
        file_id: fileId,
      },
    });
  },

  async downloadFile(token: string, fileId: string) {
    const fileInfo = await this.getFile(token, fileId);

    if (!fileInfo.file_path) {
      throw new Error('Telegram nao retornou file_path para a midia recebida.');
    }

    const response = await fetch(getTelegramFileUrl(token, fileInfo.file_path));

    if (!response.ok) {
      throw new Error(`Falha ao baixar arquivo do Telegram (${response.status}).`);
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      filePath: fileInfo.file_path,
      mimeType: response.headers.get('content-type') || 'application/octet-stream',
    };
  },

  buildWebhookSecret(instanceId: string, token: string) {
    return getWebhookSecret(instanceId, token);
  },
};
