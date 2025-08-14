// server.js (Corrected Version)

// 1. เรียกใช้โมดูลที่จำเป็น
const express = require('express');
const http = require('http');
const path = require('path'); // <-- บรรทัดนี้ถูกต้องแล้ว
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// 2. บอกให้เซิร์ฟเวอร์รู้จักโฟลเดอร์ public
// บรรทัดนี้คือการ "ใช้" เครื่องมือ path เพื่อสร้างที่อยู่ไปยังโฟลเดอร์ public
app.use(express.static(path.join(__dirname, 'public')));

// 3. ตั้งค่า Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: "*", 
  }
});

// --- Logic ของเกม ---
const words = ["algorithm", "database", "javascript", "network", "server", "protocol", "firebase"];
let waitingPlayer = null;

io.on('connection', (socket) => {
  // ... โค้ดส่วนที่เหลือถูกต้องทั้งหมด ...
  console.log('ผู้เล่นเชื่อมต่อเข้ามา:', socket.id);

  if (waitingPlayer) {
    const roomName = `room-${waitingPlayer.id}-${socket.id}`;
    waitingPlayer.join(roomName);
    socket.join(roomName);
    io.to(roomName).emit('gameStart', { p1: waitingPlayer.id, p2: socket.id });
    console.log(`เริ่มเกมในห้อง ${roomName}`);
    sendNewWord(roomName);
    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
    socket.emit('waiting', 'กำลังรอผู้เล่นอีกคน...');
  }

  socket.on('wordTyped', (data) => {
    console.log(`ผู้เล่น ${socket.id} พิมพ์เสร็จแล้วในห้อง ${data.room}`);
    socket.to(data.room).emit('opponentFinished'); 
    sendNewWord(data.room);
  });

  socket.on('disconnect', () => {
    console.log('ผู้เล่นตัดการเชื่อมต่อ:', socket.id);
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }
  });
});

function sendNewWord(room) {
  const newWord = words[Math.floor(Math.random() * words.length)];
  io.to(room).emit('newWord', newWord);
  console.log(`ส่งคำใหม่ "${newWord}" ไปยังห้อง ${room}`);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`เซิร์ฟเวอร์กำลังรอการเชื่อมต่อที่ Port ${PORT}`);
});
