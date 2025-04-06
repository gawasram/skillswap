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
  logIndex: {
    type: Number,
    required: true
  },
  args: {
    type: Object,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure that events are unique by their txHash and logIndex
contractEventSchema.index({ transactionHash: 1, logIndex: 1 }, { unique: true });

const ContractEvent = mongoose.model('ContractEvent', contractEventSchema);

module.exports = ContractEvent; 