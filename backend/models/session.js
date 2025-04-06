const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'declined', 'canceled', 'completed'],
    default: 'requested'
  },
  meetingLink: {
    type: String
  },
  recording: {
    type: String
  },
  notes: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String
  },
  blockchainId: {
    type: String
  }
}, {
  timestamps: true
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;