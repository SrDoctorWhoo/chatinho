const axios = require('axios');

const EVOLUTION_API_URL = "https://apiwp.oabgo.org.br";
const EVOLUTION_API_KEY = "D381264DD0DAB5D9C0F13AEDD9DCA8D5";
const WEBHOOK_URL = "https://dc9b30fe4d8e6634-187-115-88-130.serveousercontent.com/api/webhook/whatsapp";

async function debug() {
  const evolution = axios.create({
    baseURL: EVOLUTION_API_URL,
    headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' }
  });

  const bodies = [
    {
      name: "Tentativa 1 (Padrão v2 Doc)",
      data: {
        url: WEBHOOK_URL,
        enabled: true,
        webhookByEvents: true,
        webhookBase64: true,
        events: ["MESSAGES_UPSERT"]
      }
    },
    {
      name: "Tentativa 2 (Sem flags)",
      data: {
        url: WEBHOOK_URL,
        enabled: true,
        events: ["MESSAGES_UPSERT"]
      }
    },
    {
        name: "Tentativa 3 (webhookUrl em vez de url)",
        data: {
          webhookUrl: WEBHOOK_URL,
          enabled: true,
          events: ["MESSAGES_UPSERT"]
        }
    }
  ];

  for (const item of bodies) {
    try {
      console.log(`\n--- Testando: ${item.name} ---`);
      const res = await evolution.post('/webhook/set/TESTE', item.data);
      console.log('Sucesso!', res.data);
      break;
    } catch (err) {
      console.log('Erro:', JSON.stringify(err.response?.data || err.message, null, 2));
    }
  }
}

debug();
