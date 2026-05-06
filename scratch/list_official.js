const axios = require('axios');
require('dotenv').config();

async function findOfficialInstance() {
  try {
    const url = process.env.EVOLUTION_API_URL + '/instance/fetchInstances';
    const apiKey = process.env.EVOLUTION_API_KEY;

    const response = await axios.get(url, {
      headers: { 'apikey': apiKey }
    });

    const instances = response.data;
    const official = instances.filter(i => i.integration !== 'WHATSAPP-BAILEYS');

    if (official.length > 0) {
      console.log('--- Instâncias Oficiais Encontradas ---');
      official.forEach(inst => {
        console.log(`Nome: ${inst.instanceName}`);
        console.log(`Integração: ${inst.integration}`);
        console.log(`Status: ${inst.status}`);
        console.log('---------------------------');
      });
    } else {
      console.log('Nenhuma instância oficial (Cloud API) encontrada no servidor atual.');
      console.log('Instâncias Baileys encontradas:', instances.map(i => i.instanceName).join(', '));
    }

  } catch (error) {
    console.error('Erro:', error.message);
  }
}

findOfficialInstance();
