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
    enum: ['requested', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'requested'
  },
  blockchainSessionId: {
    type: String
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
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentTxHash: {
    type: String
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String
  }
}, { timestamps: true });

// Indexes for faster queries
sessionSchema.index({ mentor: 1, startTime: -1 });
sessionSchema.index({ mentee: 1, startTime: -1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ blockchainSessionId: 1 }, { unique: true, sparse: true });

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session; 