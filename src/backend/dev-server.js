// Simple development server without database dependencies
const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

// Create Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'SkillSwap API Server - Development Mode' });
});

// WebRTC endpoint info
app.get('/api/webrtc/info', (req, res) => {
  res.json({
    success: true,
    data: {
      socketUrl: `http://localhost:${PORT}`,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    }
  });
});

// Sessions endpoints
app.get('/api/sessions', (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      sessions: [] 
    } 
  });
});

app.get('/api/sessions/:id', (req, res) => {
  // Return a mock session for development
  res.json({
    success: true,
    data: {
      id: req.params.id,
      topic: "Development Video Session",
      status: "accepted",
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000), // 1 hour later
      meetingLink: "https://meet.example.com/dev-session",
      mentor: {
        name: "Dev Mentor",
        walletAddress: "0xMentor123"
      },
      mentee: {
        name: "Dev Mentee",
        walletAddress: "0xMentee456"
      }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: err.message
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Development server running on port ${PORT}`);
  console.log(`WebRTC info available at http://localhost:${PORT}/api/webrtc/info`);
});

module.exports = app; 