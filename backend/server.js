const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const http = require('http');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sessionRoutes = require('./routes/sessions');
const webhookRoutes = require('./routes/webhooks');
const blockchainRoutes = require('./routes/blockchain');

// Import WebRTC signaling service
const { initializeSocketServer } = require('./services/webrtc/signaling');

// Create Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebRTC signaling
const io = initializeSocketServer(server);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Optional MongoDB connection
if (process.env.MONGODB_URI) {
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Running without MongoDB connection');
  });
} else {
  console.log('MONGODB_URI not provided. Running without database connection.');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Add WebRTC endpoint info
app.get('/api/webrtc/info', (req, res) => {
  res.json({
    success: true,
    data: {
      socketUrl: process.env.SOCKET_URL || `http://localhost:${PORT}`,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 