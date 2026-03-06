// index.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const authRoute = require("./routes/auth_route");
const userinfoRoute = require("./routes/userinfo_route");
const packageRoute = require("./routes/package_route.js");
const historyRoute = require("./routes/history_route.js");
const notificationRoutes = require("./routes/notification_route");
const adminUserRoute = require("./routes/admin_user_route");
const managerRoute = require("./routes/manager_route.js");
const awsMetricsRoute = require("./routes/aws_metrics_route");
const packageDashboardRoutes = require("./routes/package_dashboard_routes");


const { swaggerUi, swaggerSpec } = require("./docs/swagger");

const app = express();

/* ================= Middleware ================= */

app.use(cors());
app.use(express.json());

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: false,
  })
);

/* ================= Routes ================= */

app.get("/", (req, res) => res.send("API v1 is running."));

app.use("/api/v1/auth", authRoute);
app.use("/api/v1", userinfoRoute);
app.use("/api/v1", packageRoute);
app.use("/api/v1", historyRoute);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/admin", adminUserRoute);
app.use("/api/v1/manager", managerRoute);
app.use("/api/v1/aws", awsMetricsRoute);
app.use("/api/v1/package-dashboard", packageDashboardRoutes);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/* ================= React Build Static ================= */

app.use(express.static(path.join(__dirname, "public")));

app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= Create HTTP Server ================= */

const server = http.createServer(app);

/* ================= Socket.io (WebRTC Signaling) ================= */

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room: ${room}`);
  });

  socket.on("conveyor-start", () => {
  console.log("Start conveyor command");

    io.emit("run-conveyor");
  });

  socket.on("conveyor-stop", () => {
    console.log("Stop conveyor command");

    io.emit("stop-conveyor");
  });


  socket.on("offer", ({ room, offer }) => {
    socket.to(room).emit("offer", offer);
  });

  socket.on("answer", ({ room, answer }) => {
    socket.to(room).emit("answer", answer);
  });

  socket.on("ice-candidate", ({ room, candidate }) => {
    socket.to(room).emit("ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/* ================= Start Server ================= */

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server + Socket running on port ${PORT}`);
});