const axios = require('axios');

const EVOLUTION_API_URL = "https://apiwp.oabgo.org.br";
const EVOLUTION_API_KEY = "D381264DD0DAB5D9C0F13AEDD9DCA8D5";

async function check() {
  try {
    const res = await axios.get(`${EVOLUTION_API_URL}/webhook/find/TESTE`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    console.log('Webhook Atual:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Erro ao buscar webhook:', err.response?.data || err.message);
  }
}

check();
