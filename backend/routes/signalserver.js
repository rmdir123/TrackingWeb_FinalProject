const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // ✅ เพิ่ม join-room handler
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`${socket.id} joined room: ${room}`);
  });

  // ✅ destructure { room, offer } แล้วส่งแค่ offer ไปยัง room
  socket.on("offer", ({ room, offer }) => {
    socket.to(room).emit("offer", offer);
  });

  // ✅ destructure { room, answer } แล้วส่งแค่ answer
  socket.on("answer", ({ room, answer }) => {
    socket.to(room).emit("answer", answer);
  });

  // ✅ destructure { room, candidate } แล้วส่งแค่ candidate
  socket.on("ice-candidate", ({ room, candidate }) => {
    socket.to(room).emit("ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("🚀 Signaling server running on port 5000");
});
