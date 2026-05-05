const http = require('http');

const data = JSON.stringify({
  event: "messages.upsert",
  instanceName: "TESTE",
  data: {
    key: { remoteJid: "5511999999999@s.whatsapp.net", fromMe: false },
    message: { conversation: "Mensagem de teste local" }
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhook/whatsapp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => responseBody += chunk);
  res.on('end', () => console.log(`Status: ${res.statusCode}, Body: ${responseBody}`));
});

req.on('error', (e) => console.error(`Erro: ${e.message}`));
req.write(data);
req.end();
