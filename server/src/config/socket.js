const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  // Auth middleware — verify JWT before allowing connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    // Each user joins their own private room
    socket.join(`user:${socket.userId}`);

    socket.on("disconnect", () => {
      socket.leave(`user:${socket.userId}`);
    });
  });

  return io;
};

/**
 * Returns the Socket.io instance.
 * Use this in services to emit events after DB writes.
 */
const getIO = () => io;

module.exports = { initSocket, getIO };
