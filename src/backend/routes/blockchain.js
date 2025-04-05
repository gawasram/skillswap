const express = require('express');
const router = express.Router();
const ContractEvent = require('../models/contractEvent');
const { authenticate } = require('../middleware/auth');

// Get events by contract name
router.get('/events/:contractName', authenticate, async (req, res) => {
  try {
    const { contractName } = req.params;
    const { page = 1, limit = 20, eventName } = req.query;
    
    const query = { contractName };
    if (eventName) {
      query.eventName = eventName;
    }
    
    const events = await ContractEvent.find(query)
      .sort({ blockNumber: -1, logIndex: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
      
    const total = await ContractEvent.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

// Get event by transaction hash
router.get('/events/tx/:txHash', authenticate, async (req, res) => {
  try {
    const { txHash } = req.params;
    
    const events = await ContractEvent.find({ transactionHash: txHash })
      .sort({ logIndex: 1 })
      .lean();
      
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Error fetching event by tx hash:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event' });
  }
});

// Get events for a specific address (as participant)
router.get('/events/address/:address', authenticate, async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // This is a complex query that needs to find events where the address is in any of the args
    // For MongoDB, we'll use $or with multiple conditions for different event types
    
    const mentorRegistryEvents = await ContractEvent.find({
      contractName: 'mentorRegistry',
      $or: [
        { 'args.mentorAddress': address.toLowerCase() }
      ]
    })
    .sort({ blockNumber: -1, logIndex: -1 })
    .limit(parseInt(limit))
    .lean();
    
    const sessionManagerEvents = await ContractEvent.find({
      contractName: 'sessionManager',
      $or: [
        { 'args.mentor': address.toLowerCase() },
        { 'args.mentee': address.toLowerCase() }
      ]
    })
    .sort({ blockNumber: -1, logIndex: -1 })
    .limit(parseInt(limit))
    .lean();
    
    const tokenEvents = await ContractEvent.find({
      contractName: 'mentorshipToken',
      $or: [
        { 'args.mentor': address.toLowerCase() },
        { 'args.mentee': address.toLowerCase() },
        { 'args.from': address.toLowerCase() },
        { 'args.to': address.toLowerCase() }
      ]
    })
    .sort({ blockNumber: -1, logIndex: -1 })
    .limit(parseInt(limit))
    .lean();
    
    // Combine all events and sort by blockNumber and logIndex
    const events = [...mentorRegistryEvents, ...sessionManagerEvents, ...tokenEvents]
      .sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
          return b.blockNumber - a.blockNumber;
        }
        return b.logIndex - a.logIndex;
      })
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching events for address:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
});

module.exports = router; 