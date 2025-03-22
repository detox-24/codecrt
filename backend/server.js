const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:4200', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  const sessionId = socket.handshake.query.sessionId || 'default';
  socket.join(sessionId);
  console.log(`User ${socket.id} joined ${sessionId}`);

  socket.on('codeChange', (data) => {
    console.log('Received codeChange:', data);
    io.to(sessionId).emit('codeUpdate', { code: data.code, sender: socket.id });
  });

  socket.on('disconnect', () => console.log(`User ${socket.id} left ${sessionId}`));
});

app.get('/', (req, res) => res.send('CodeCRT backend live!'));

server.listen(3000, () => console.log('Server on port 3000'));