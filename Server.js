// server.js (Final Corrected Version)

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Serve the static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Allows connections from any origin
    methods: ["GET", "POST"]
  }
});

// Game Logic
const words = ["algorithm", "database", "javascript", "network", "server", "protocol", "firebase"];
let waitingPlayer = null;

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  if (waitingPlayer) {
    const roomName = `room-${waitingPlayer.id}-${socket.id}`;
    
    waitingPlayer.join(roomName);
    socket.join(roomName);

    io.to(roomName).emit('gameStart', {
      p1: waitingPlayer.id,
      p2: socket.id
    });
    
    console.log(`Game started in room ${roomName}`);
    sendNewWord(roomName);

    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
    socket.emit('waiting', 'Waiting for another player...');
  }

  socket.on('wordTyped', (data) => {
    console.log(`Player ${socket.id} finished a word in room ${data.room}`);
    socket.to(data.room).emit('opponentFinished'); 
    sendNewWord(data.room);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }
  });
});

function sendNewWord(room) {
  const newWord = words[Math.floor(Math.random() * words.length)];
  io.to(room).emit('newWord', newWord);
  console.log(`Sent new word "${newWord}" to room ${room}`);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
