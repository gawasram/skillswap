const mongoose = require('mongoose');

const contractEventSchema = new mongoose.Schema({
  contractName: {
    type: String,
    required: true,
    index: true
  },
  contractAddress: {
    type: String,
    required: true,
    index: true
  },
  eventName: {
    type: String,
    required: true,
    index: true
  },
  blockNumber: {
    type: Number,
    required: true,
    index: true
  },
  blockHash: {
    type: String,
    required: true
  },
  transactionHash: {
    type: String,
    required: true,
    index: true
  },
  transactionIndex: {
    type: Number,
    required: true
  },
  logIndex: {
    type: Number,
    required: true
  },
  args: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  processed: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

// Composite index for unique event identification
contractEventSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true });

const ContractEvent = mongoose.model('ContractEvent', contractEventSchema);
module.exports = ContractEvent; 