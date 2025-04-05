const express = require('express');
const router = express.Router();
const Session = require('../models/session');
const User = require('../models/user');
const { authenticate } = require('../middleware/auth');
const { ethers } = require('ethers');
const SessionManagerABI = require('../../contracts/artifacts/contracts/SessionManager.sol/SessionManager.json').abi;

// Create a new session request
router.post('/', authenticate, async (req, res) => {
  try {
    const { mentorId, startTime, endTime, topic } = req.body;
    
    // Validate input
    if (!mentorId || !startTime || !endTime || !topic) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields'
      });
    }
    
    // Check if mentor exists
    const mentor = await User.findById(mentorId);
    if (!mentor || !mentor.isMentor) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }
    
    // Create session in database
    const session = new Session({
      mentor: mentorId,
      mentee: req.user._id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      topic,
      status: 'requested'
    });
    
    await session.save();
    
    res.status(201).json({
      success: true,
      data: {
        sessionId: session._id,
        mentor: mentor.name,
        startTime: session.startTime,
        endTime: session.endTime,
        topic: session.topic,
        status: session.status
      }
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ success: false, message: 'Failed to create session' });
  }
});

// Get session details
router.get('/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await Session.findById(sessionId)
      .populate('mentor', 'name email walletAddress')
      .populate('mentee', 'name email walletAddress');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check if user is mentor or mentee
    const isMentor = session.mentor._id.toString() === req.user._id.toString();
    const isMentee = session.mentee._id.toString() === req.user._id.toString();
    
    if (!isMentor && !isMentee) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this session'
      });
    }
    
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch session' });
  }
});

// Accept a session (mentor only)
router.post('/:sessionId/accept', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { meetingLink } = req.body;
    
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check if user is the mentor
    if (session.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the mentor can accept sessions'
      });
    }
    
    // Check if session can be accepted
    if (session.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: `Session cannot be accepted because it is ${session.status}`
      });
    }
    
    // Update session status
    session.status = 'accepted';
    session.meetingLink = meetingLink;
    await session.save();
    
    // TODO: Also update on blockchain if needed
    
    res.json({
      success: true,
      data: {
        sessionId: session._id,
        status: session.status,
        meetingLink: session.meetingLink
      }
    });
  } catch (error) {
    console.error('Error accepting session:', error);
    res.status(500).json({ success: false, message: 'Failed to accept session' });
  }
});

// Complete a session (mentor only)
router.post('/:sessionId/complete', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes } = req.body;
    
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check if user is the mentor
    if (session.mentor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the mentor can complete sessions'
      });
    }
    
    // Check if session can be completed
    if (session.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: `Session cannot be completed because it is ${session.status}`
      });
    }
    
    // Update session status
    session.status = 'completed';
    if (notes) {
      session.notes = notes;
    }
    await session.save();
    
    res.json({
      success: true,
      data: {
        sessionId: session._id,
        status: session.status
      }
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ success: false, message: 'Failed to complete session' });
  }
});

// Get all sessions for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, role, page = 1, limit = 10 } = req.query;
    
    const query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by user role (mentor or mentee)
    if (role === 'mentor') {
      query.mentor = req.user._id;
    } else if (role === 'mentee') {
      query.mentee = req.user._id;
    } else {
      // If no role specified, get all sessions for this user
      query.$or = [
        { mentor: req.user._id },
        { mentee: req.user._id }
      ];
    }
    
    const sessions = await Session.find(query)
      .populate('mentor', 'name email walletAddress')
      .populate('mentee', 'name email walletAddress')
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
      
    const total = await Session.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
});

// Rate a completed session (mentee only)
router.post('/:sessionId/rate', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check if user is the mentee
    if (session.mentee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the mentee can rate sessions'
      });
    }
    
    // Check if session is completed
    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed sessions can be rated'
      });
    }
    
    // Check if already rated
    if (session.rating) {
      return res.status(400).json({
        success: false,
        message: 'Session already rated'
      });
    }
    
    // Update session with rating
    session.rating = rating;
    session.feedback = feedback;
    await session.save();
    
    // TODO: Update mentor's rating on blockchain
    
    res.json({
      success: true,
      data: {
        sessionId: session._id,
        rating: session.rating,
        feedback: session.feedback
      }
    });
  } catch (error) {
    console.error('Error rating session:', error);
    res.status(500).json({ success: false, message: 'Failed to rate session' });
  }
});

module.exports = router; 