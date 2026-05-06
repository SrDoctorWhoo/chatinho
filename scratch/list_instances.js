const axios = require('axios');
require('dotenv').config();

async function listInstances() {
  try {
    const url = process.env.EVOLUTION_API_URL + '/instance/fetchInstances';
    const apiKey = process.env.EVOLUTION_API_KEY;

    console.log('--- Buscando Instâncias na Evolution API ---');
    console.log('URL:', url);

    const response = await axios.get(url, {
      headers: { 'apikey': apiKey }
    });

    console.log('\nInstâncias encontradas:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('Erro ao buscar instâncias:', error.response ? error.response.data : error.message);
  }
}

listInstances();
