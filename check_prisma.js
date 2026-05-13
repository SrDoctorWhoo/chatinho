const { PrismaClient } = require('@prisma/client');
// Mocking the adapter for check only
const p = new PrismaClient({
    adapter: {
        provider: 'sqlserver',
        adapterName: 'mock',
        queryRaw: async () => {},
        executeRaw: async () => {},
    }
});
console.log('Task model present:', !!p.task);
console.log('Available models:', Object.keys(p).filter(k => !k.startsWith('_') && typeof p[k] === 'object' && p[k] !== null));
p.$disconnect();
