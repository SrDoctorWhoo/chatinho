const { Connection, Request } = require('tedious');

async function executeSankhyaQuery(sql, params = {}) {
  return new Promise((resolve, reject) => {
    const config = {
      server: process.env.DB2_HOST || '192.168.10.1',
      authentication: {
        type: 'default',
        options: {
          userName: process.env.DB2_USERNAME || 'sankhya',
          password: process.env.DB2_PASSWORD || '55tec321',
        }
      },
      options: {
        port: parseInt(process.env.DB2_PORT || '1439'),
        database: process.env.DB2_DATABASE || 'SANKHYA_PROD',
        encrypt: process.env.DB2_ENCRYPT === 'true',
        trustServerCertificate: true,
        rowCollectionOnDone: true,
        useColumnNames: true
      }
    };

    const connection = new Connection(config);

    connection.on('connect', (err) => {
      if (err) {
        console.error('[Sankhya] Connection Error:', err);
        return reject(err);
      }

      // Substituir variáveis no SQL
      let finalSql = sql;
      Object.entries(params).forEach(([key, value]) => {
        finalSql = finalSql.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      console.log('[Sankhya] Executing SQL:', finalSql);

      const request = new Request(finalSql, (err, rowCount, rows) => {
        if (err) {
          console.error('[Sankhya] Request Error:', err);
          reject(err);
        } else {
          // Transformar o formato do Tedious em um JSON amigável
          const results = rows.map(row => {
            const item = {};
            Object.keys(row).forEach(key => {
              item[key] = row[key].value;
            });
            return item;
          });
          resolve(results);
        }
        connection.close();
      });

      connection.execSql(request);
    });

    connection.connect();
  });
}

module.exports = { executeSankhyaQuery };
