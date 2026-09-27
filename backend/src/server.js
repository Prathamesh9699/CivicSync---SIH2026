import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/database.js';
import { env } from './config/env.js';
import { setSocketIO } from './services/notificationService.js';
import { startEscalationJob } from './jobs/escalationJob.js';

const server = http.createServer(app);

// Socket.io for Real-Time Cleanliness Alerts
const io = new Server(server, {
  cors: {
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Real-time client connected: ${socket.id}`);

  socket.on('join_role', (role) => {
    socket.join(role);
    console.log(`[Socket.io] Socket ${socket.id} joined role channel: ${role}`);
  });

  socket.on('join_user', (userId) => {
    socket.join(userId);
    console.log(`[Socket.io] Socket ${socket.id} joined user channel: ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Pass IO instance to notification service
setSocketIO(io);

// Start Server & Connect Database
const startServer = async () => {
  try {
    await connectDB();

    startEscalationJob();

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `\n⚠️ [Port Conflict] Port ${env.PORT} is already in use.`
        );
        console.error(
          `👉 The backend is already active on http://localhost:${env.PORT}\n`
        );
      } else {
        console.error('[Server Error]', err);
      }
    });

    server.listen(env.PORT, () => {
      console.log('====================================================');
      console.log(
        `🚀 CleanTrack Backend Engine Live on Port ${env.PORT}`
      );
      console.log(
        `🌐 Health Check: http://localhost:${env.PORT}/api/health`
      );
      console.log(`📡 Socket.io: ws://localhost:${env.PORT}`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error(
      '[CleanTrack] Backend startup aborted because MongoDB connection failed.'
    );
    process.exit(1);
  }
};

startServer();

