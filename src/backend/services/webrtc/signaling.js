const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const Session = require('../../models/session');

// Create recordings directory if it doesn't exist
const recordingsPath = process.env.RECORDING_PATH || './recordings';
if (!fs.existsSync(recordingsPath)) {
  console.log(`Creating recordings directory at ${recordingsPath}`);
  fs.mkdirSync(recordingsPath, { recursive: true });
}

// Room management
const rooms = new Map();

// We'll use in-memory storage instead of Redis for development
const redisClient = null;
console.log('Redis disabled for development');

// Simple token verification function (replace with actual JWT verification in production)
const verifyToken = (token) => {
  // For development/demo purposes only
  // In a real app, you would verify the JWT token
  return {
    userId: 'demo-user-id',
    username: 'Demo User'
  };
};

// Initialize Socket.IO server
const initializeSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      // Verify token (implement with your auth strategy)
      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join a session room
    socket.on('join-session', async ({ sessionId }) => {
      try {
        // For development, we can skip session verification
        // In production, you would verify the session exists and user is authorized
        let userRole = 'mentor'; // Default role for testing
        
        try {
          const session = await Session.findById(sessionId);
          if (session) {
            // Check if user is mentor or mentee for this session
            const isMentor = session.mentor.toString() === socket.userId;
            const isMentee = session.mentee.toString() === socket.userId;
            
            if (!isMentor && !isMentee) {
              return socket.emit('error', { message: 'Not authorized for this session' });
            }
            
            userRole = isMentor ? 'mentor' : 'mentee';
          }
        } catch (error) {
          console.log('Session verification skipped for development');
        }
        
        const roomId = `session:${sessionId}`;
        socket.join(roomId);
        
        // Create room if it doesn't exist
        if (!rooms.has(roomId)) {
          rooms.set(roomId, { 
            users: new Map(),
            sessionId,
            startTime: Date.now(),
            recording: false
          });
          
          // Store session info in Redis if available
          if (redisClient) {
            try {
              await redisClient.set(`room:${roomId}`, JSON.stringify({
                sessionId,
                startTime: Date.now()
              }));
            } catch (error) {
              console.error('Redis error:', error);
            }
          }
        }
        
        // Add user to room
        const room = rooms.get(roomId);
        room.users.set(socket.userId, {
          socketId: socket.id,
          username: socket.username,
          role: userRole
        });
        
        // Notify room members
        io.to(roomId).emit('user-joined', {
          userId: socket.userId,
          username: socket.username,
          role: userRole
        });
        
        // Send current users to the new participant
        const users = Array.from(room.users.entries()).map(([id, user]) => ({
          userId: id,
          username: user.username,
          role: user.role
        }));
        
        socket.emit('room-users', { users });
        
        console.log(`User ${socket.userId} joined room ${roomId}`);
      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Handle WebRTC signaling
    socket.on('signal', ({ to, signal }) => {
      io.to(to).emit('signal', {
        from: socket.id,
        signal
      });
    });

    // Start recording
    socket.on('start-recording', async ({ sessionId }) => {
      const roomId = `session:${sessionId}`;
      const room = rooms.get(roomId);
      
      if (!room) {
        return socket.emit('error', { message: 'Room not found' });
      }
      
      // Check if user is the mentor (only mentors can start recording)
      const user = room.users.get(socket.userId);
      if (!user || user.role !== 'mentor') {
        return socket.emit('error', { message: 'Only mentors can start recording' });
      }
      
      room.recording = true;
      
      // TODO: Implement actual recording logic
      // This would typically integrate with a media server
      
      io.to(roomId).emit('recording-started');
    });

    // Stop recording
    socket.on('stop-recording', async ({ sessionId }) => {
      const roomId = `session:${sessionId}`;
      const room = rooms.get(roomId);
      
      if (!room || !room.recording) {
        return;
      }
      
      room.recording = false;
      
      // TODO: Stop recording and save the file
      
      io.to(roomId).emit('recording-stopped');
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      // Find all rooms the user is in
      for (const [roomId, room] of rooms.entries()) {
        if (room.users.has(socket.userId)) {
          // Remove user from room
          room.users.delete(socket.userId);
          
          // Notify others
          io.to(roomId).emit('user-left', { userId: socket.userId });
          
          // If room is empty, clean it up
          if (room.users.size === 0) {
            rooms.delete(roomId);
            
            // Clean up in Redis if available
            if (redisClient) {
              try {
                await redisClient.del(`room:${roomId}`);
              } catch (error) {
                console.error('Redis error:', error);
              }
            }
            
            console.log(`Room ${roomId} deleted`);
          }
        }
      }
    });
  });

  return io;
};

module.exports = { initializeSocketServer }; 