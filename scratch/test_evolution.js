const axios = require('axios');

const EVOLUTION_API_URL = "https://apiwp.oabgo.org.br";
const EVOLUTION_API_KEY = "D381264DD0DAB5D9C0F13AEDD9DCA8D5";

async function test() {
  const evolution = axios.create({
    baseURL: EVOLUTION_API_URL,
    headers: {
      'apikey': EVOLUTION_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  try {
    console.log('--- Verificando Instância TESTE ---');
    const status = await evolution.get('/instance/connectionState/TESTE');
    console.log('Status Atual:', JSON.stringify(status.data, null, 2));

    if (status.data.instance?.state !== 'open') {
        console.log('Solicitando novo QR Code...');
        const connect = await evolution.get('/instance/connect/TESTE');
        if (connect.data.base64) {
            console.log('QR Code Gerado com Sucesso (Base64 presente)');
        } else {
            console.log('Aviso: QR Code não retornado no campo base64');
            console.log('Resposta completa do connect:', JSON.stringify(connect.data, null, 2));
        }
    } else {
        console.log('Instância já está CONNECTED.');
    }
  } catch (err) {
    console.error('Erro no teste:', err.response?.data || err.message);
  }
}

test();
