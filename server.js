require('dotenv').config();
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const express = require("express");

console.log("[UNIFIED] Starting server with ENV:", process.env.NODE_ENV);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const server = createServer(expressApp);
  
  // 1. INICIALIZAR SOCKET.IO PRIMEIRO
  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Log de conexão para saber se o navegador achou o socket
  io.on('connection', (socket) => {
    console.log(`[Socket] Conectado: ${socket.id}`);
  });

  // Heartbeat (Ping/Pong)
  setInterval(() => {
    io.emit('ping', { time: new Date().toISOString() });
  }, 5000);

  // 2. ROTA DE NOTIFICAÇÃO (JSON aplicado apenas aqui)
  expressApp.post('/api/internal/notify-socket', express.json(), (req, res) => {
    const { event, data } = req.body;
    
    if (event && data) {
      console.log(`[Socket Server] 📢 BROADCAST: ${event}`);
      io.emit(event, data);
      return res.status(200).json({ success: true });
    }
    
    return res.status(400).json({ success: false, error: 'Invalid data' });
  });

  // 4. LOGGER PARA DEBUG
  expressApp.use((req, res, next) => {
    if (req.method === 'POST') {
      console.log(`[HTTP Debug] 📥 POST ${req.url}`);
    }
    next();
  });

  // 5. HANDLE NEXT.JS
  expressApp.all("*", (req, res) => {
    const parsedUrl = parse(req.url, true);
    return handle(req, res, parsedUrl);
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Unified Server ready on http://localhost:${PORT}`);
  });
});
