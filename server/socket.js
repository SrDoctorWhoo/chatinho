const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST"]
  }
});

// Endpoint for Next.js to notify new messages
app.post('/notify', (req, res) => {
  const { event, data } = req.body;
  
  if (!event || !data) {
    return res.status(400).json({ error: 'Event and data required' });
  }

  console.log(`Broadcasting event: ${event}`);
  io.emit(event, data);
  
  return res.json({ success: true });
});

io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id} (Transport: ${socket.conn.transport.name})`);

  socket.conn.on('upgrade', (transport) => {
    console.log(`[Socket] Transport upgraded to ${transport.name} for ${socket.id}`);
  });

  socket.on('error', (err) => {
    console.error(`[Socket] Error for ${socket.id}:`, err);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] User disconnected: ${socket.id} (Reason: ${reason})`);
  });
});

const PORT = process.env.SOCKET_PORT || 3005;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
