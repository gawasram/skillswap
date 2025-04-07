const ethers = require('ethers');
const { createLogger } = require('../../utils/logger');
const ContractEvent = require('../../models/contractEvent');

// ABIs for the contracts
const MentorshipTokenABI = require('../../../contracts/artifacts/contracts/MentorshipToken.sol/MentorshipToken.json').abi;
const MentorRegistryABI = require('../../../contracts/artifacts/contracts/MentorRegistry.sol/MentorRegistry.json').abi;
const SessionManagerABI = require('../../../contracts/artifacts/contracts/SessionManager.sol/SessionManager.json').abi;
const ReputationSystemABI = require('../../../contracts/artifacts/contracts/ReputationSystem.sol/ReputationSystem.json').abi;

// Contract addresses
const CONTRACT_ADDRESSES = {
  MENTORSHIP_TOKEN: "0x3bc607852393dcc75a3fccf0deb1699001d32bbd",
  MENTOR_REGISTRY: "0xcfa935f28fff8f33ee08d6fdeed91b66aff6236e",
  SESSION_MANAGER: "0xa976da47324dbb47e5bea23e8a4f3a369b42fe88",
  REPUTATION_SYSTEM: "0x74996f530fe88776d2ecef1fe301e523c55b61e5",
  SKILLSWAP_MAIN: "0x242f1c5ad353cb06034265dcbe943f816a0ba756"
};

const logger = createLogger('blockchain-indexer');

class BlockchainEventIndexer {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.XDC_RPC_URL);
    this.initializeContracts();
    this.isIndexing = false;
    this.lastProcessedBlock = 0;
    this.retryAttempts = 0;
    this.maxRetries = 10;
    this.retryInterval = 5000; // 5 seconds
  }

  initializeContracts() {
    this.contracts = {
      mentorshipToken: new ethers.Contract(
        CONTRACT_ADDRESSES.MENTORSHIP_TOKEN,
        MentorshipTokenABI,
        this.provider
      ),
      mentorRegistry: new ethers.Contract(
        CONTRACT_ADDRESSES.MENTOR_REGISTRY,
        MentorRegistryABI,
        this.provider
      ),
      sessionManager: new ethers.Contract(
        CONTRACT_ADDRESSES.SESSION_MANAGER,
        SessionManagerABI,
        this.provider
      ),
      reputationSystem: new ethers.Contract(
        CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
        ReputationSystemABI,
        this.provider
      )
    };
  }

  async start() {
    if (this.isIndexing) {
      logger.info('Indexer already running');
      return;
    }

    this.isIndexing = true;
    
    try {
      // Get last processed block from database
      const lastIndexedEvent = await ContractEvent.findOne({}, {}, { sort: { 'blockNumber': -1 } });
      this.lastProcessedBlock = lastIndexedEvent ? lastIndexedEvent.blockNumber : 0;
      
      logger.info(`Starting indexer from block ${this.lastProcessedBlock}`);
      
      // Start the indexing loop
      this.indexLoop();
    } catch (error) {
      logger.error(`Error starting indexer: ${error.message}`);
      this.isIndexing = false;
    }
  }

  async stop() {
    logger.info('Stopping indexer');
    this.isIndexing = false;
  }

  async indexLoop() {
    while (this.isIndexing) {
      try {
        // Get current block number
        const currentBlock = await this.provider.getBlockNumber();
        
        if (currentBlock <= this.lastProcessedBlock) {
          // No new blocks, wait and try again
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        
        // Process blocks in batches (to avoid RPC request limits)
        const batchSize = 100;
        const startBlock = this.lastProcessedBlock + 1;
        const endBlock = Math.min(currentBlock, startBlock + batchSize - 1);
        
        logger.info(`Processing blocks ${startBlock} to ${endBlock}`);
        
        // Process events from all contracts
        await Promise.all([
          this.processContractEvents('mentorshipToken', startBlock, endBlock),
          this.processContractEvents('mentorRegistry', startBlock, endBlock),
          this.processContractEvents('sessionManager', startBlock, endBlock),
          this.processContractEvents('reputationSystem', startBlock, endBlock)
        ]);
        
        // Update last processed block
        this.lastProcessedBlock = endBlock;
        this.retryAttempts = 0;
        
        // Small delay to avoid overwhelming the node
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Error in indexing loop: ${error.message}`);
        
        // Implement retry mechanism
        this.retryAttempts++;
        
        if (this.retryAttempts > this.maxRetries) {
          logger.error(`Max retries exceeded, stopping indexer`);
          this.isIndexing = false;
          return;
        }
        
        // Exponential backoff
        const delay = this.retryInterval * Math.pow(2, this.retryAttempts - 1);
        logger.info(`Retrying in ${delay}ms (attempt ${this.retryAttempts}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    logger.info('Indexer stopped');
  }

  async processContractEvents(contractName, fromBlock, toBlock) {
    const contract = this.contracts[contractName];
    
    // Get all events from the contract
    const events = await contract.queryFilter('*', fromBlock, toBlock);
    
    for (const event of events) {
      // Skip if already processed (in case of reorg)
      const exists = await ContractEvent.exists({
        transactionHash: event.transactionHash,
        logIndex: event.logIndex
      });
      
      if (exists) {
        continue;
      }
      
      // Parse event data
      const parsedEvent = {
        contractName,
        contractAddress: contract.address,
        eventName: event.event,
        blockNumber: event.blockNumber,
        blockHash: event.blockHash,
        transactionHash: event.transactionHash,
        transactionIndex: event.transactionIndex,
        logIndex: event.logIndex,
        args: {},
        timestamp: (await this.provider.getBlock(event.blockNumber)).timestamp * 1000 // Convert to milliseconds
      };
      
      // Extract arguments
      if (event.args) {
        // Convert BigNumber to string to avoid MongoDB issues
        for (const [key, value] of Object.entries(event.args)) {
          if (ethers.BigNumber.isBigNumber(value)) {
            parsedEvent.args[key] = value.toString();
          } else if (typeof value === 'object' && value !== null) {
            // Handle nested objects with potential BigNumbers
            parsedEvent.args[key] = this.convertBigNumbersToString(value);
          } else {
            parsedEvent.args[key] = value;
          }
        }
      }
      
      // Save to database
      const contractEvent = new ContractEvent(parsedEvent);
      await contractEvent.save();
      
      logger.info(`Indexed ${contractName} event ${event.event} in block ${event.blockNumber}`);
    }
    
    return events.length;
  }

  convertBigNumbersToString(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertBigNumbersToString(item));
    }

    if (ethers.BigNumber.isBigNumber(obj)) {
      return obj.toString();
    }

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (ethers.BigNumber.isBigNumber(value)) {
        result[key] = value.toString();
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.convertBigNumbersToString(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
}

module.exports = new BlockchainEventIndexer(); 