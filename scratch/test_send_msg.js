const axios = require('axios');

const url = 'https://apiwp.oabgo.org.br/message/sendText/TESTE';
const headers = {
  'apikey': 'D381264DD0DAB5D9C0F13AEDD9DCA8D5',
  'Content-Type': 'application/json'
};

async function testPayload(payload, name) {
  try {
    console.log(`Testando payload: ${name}`);
    const res = await axios.post(url, payload, { headers });
    console.log(`✅ Sucesso (${name}):`, res.status);
    return true;
  } catch (err) {
    console.log(`❌ Erro (${name}):`, err.response?.data || err.message);
    return false;
  }
}

async function run() {
  const number = "123456789012"; // numero qualquer para ver se passa da validacao
  
  // Teste 1: Padrão V2 Simples
  const p1 = {
    number: number,
    text: "Teste V2"
  };
  
  const ok1 = await testPayload(p1, "V2 Simples");
  if (ok1) return;

  // Teste 2: V2 com options
  const p2 = {
    number: number,
    textMessage: { text: "Teste" }
  };
  await testPayload(p2, "Objeto textMessage");
}

run();
