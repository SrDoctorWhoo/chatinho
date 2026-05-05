const axios = require('axios');

const url = 'https://apiwp.oabgo.org.br/message/sendText/TESTE';
const headers = {
  'apikey': 'D381264DD0DAB5D9C0F13AEDD9DCA8D5',
  'Content-Type': 'application/json'
};

async function testPayload(payload, name) {
  try {
    const res = await axios.post(url, payload, { headers });
    return true;
  } catch (err) {
    console.log(`❌ Erro (${name}):`);
    if (err.response?.data?.response?.message) {
      console.log(JSON.stringify(err.response.data.response.message, null, 2));
    } else {
      console.log(err.message);
    }
    return false;
  }
}

async function run() {
  await testPayload({ number: "123456789012", text: "Teste" }, "V2 Simples");
  await testPayload({ number: "123456789012", textMessage: { text: "Teste" } }, "V1 Legacy");
}

run();
