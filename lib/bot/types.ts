export interface BotContext {
  conversationId: string;
  instanceName: string;
  remoteJid: string;
  variables: Record<string, any>;
  platform: string;
}

export interface BotResponse {
  success: boolean;
  message?: string;
  error?: string;
}
