const axios = require('axios');

const PUBLIC_URL = "https://dc9b30fe4d8e6634-187-115-88-130.serveousercontent.com/api/webhook/whatsapp";

async function test() {
  try {
    console.log('Enviando POST para:', PUBLIC_URL);
    const res = await axios.post(PUBLIC_URL, {
      event: "MESSAGES_UPSERT",
      data: {
          key: { remoteJid: "5511999999999@s.whatsapp.net", fromMe: false },
          message: { conversation: "Teste Externo" }
      }
    }, { timeout: 10000 });
    console.log('Resposta:', res.status, res.data);
  } catch (err) {
    console.error('Erro ao acessar URL pública:', err.message);
    if (err.response) {
        console.log('Status Erro:', err.response.status);
        console.log('Data Erro:', err.response.data);
    }
  }
}

test();
