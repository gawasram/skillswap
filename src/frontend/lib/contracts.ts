import * as ethers from "ethers";
import { 
  SkillSwapMainABI, 
  MentorRegistryABI, 
  SessionManagerABI, 
  ReputationSystemABI, 
  MentorshipTokenABI,
  SessionStatus
} from "./contract-abis";

// Helper function to safely process addresses without triggering ENS resolution
const safeResolveAddress = (addressOrName: string): string => {
  // If it's already a valid address, return it immediately (bypassing ENS)
  if (ethers.utils.isAddress(addressOrName)) {
    return addressOrName;
  }
  
  // For XDC addresses that start with "xdc", convert to "0x" format for ethers.js
  if (addressOrName.startsWith('xdc')) {
    return '0x' + addressOrName.slice(3);
  }
  
  // If not a valid address and not an XDC address, return as is
  // This might fail later, but it won't trigger ENS resolution
  return addressOrName;
};

// Create contract instance helper to fix type issues
const createContract = (address: string, abi: any, signerOrProvider: any) => {
  return new (ethers as any).Contract(address, abi, signerOrProvider);
};

/**
 * Interface for Mentor Profile
 */
export interface MentorProfile {
  name: string;
  skills: string[];
  hourlyRate: any; // BigNumber from ethers
  isActive: boolean;
  registrationTime: any; // BigNumber from ethers
  metadataURI: string;
}

/**
 * Interface for Session
 */
export interface Session {
  mentee: string;
  mentor: string;
  startTime: any; // BigNumber from ethers
  duration: any; // BigNumber from ethers
  totalPrice: any; // BigNumber from ethers
  topic: string;
  status: SessionStatus;
  isPaid: boolean;
  meetingLink: string;
}

/**
 * Interface for Rating
 */
export interface Rating {
  score: number;
  comment: string;
  timestamp: any; // BigNumber from ethers
  exists: boolean;
}

// Type for contract instance
type ContractInstance = any;

/**
 * SkillSwap Contracts Service
 * Provides functions to interact with the SkillSwap smart contracts
 */
export class SkillSwapContracts {
  private provider: ethers.providers.Web3Provider;
  private signer: ethers.Signer | null;
  private contracts: {
    skillSwapMain: ContractInstance | null;
    mentorRegistry: ContractInstance | null;
    sessionManager: ContractInstance | null;
    reputationSystem: ContractInstance | null;
    mentorshipToken: ContractInstance | null;
  };
  private addresses: {
    skillSwapMain: string;
    mentorRegistry: string;
    sessionManager: string;
    reputationSystem: string;
    mentorshipToken: string;
  };
  private initialized: boolean;

  constructor(provider: ethers.providers.Web3Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer || null;
    this.initialized = false;

    // Contract addresses
    this.addresses = {
      skillSwapMain: "0x242f1c5ad353cb06034265dcbe943f816a0ba756",
      mentorRegistry: "0xcfa935f28fff8f33ee08d6fdeed91b66aff6236e",
      sessionManager: "0xa976da47324dbb47e5bea23e8a4f3a369b42fe88",
      reputationSystem: "0x74996f530fe88776d2ecef1fe301e523c55b61e5",
      mentorshipToken: "0x3bc607852393dcc75a3fccf0deb1699001d32bbd"
    };

    // Initialize contract instances as null
    this.contracts = {
      skillSwapMain: null,
      mentorRegistry: null,
      sessionManager: null,
      reputationSystem: null,
      mentorshipToken: null
    };
  }

  /**
   * Initialize contracts and retrieve addresses
   */
  public async initialize(): Promise<boolean> {
    try {
      // Initialize all contracts with their addresses
      this.contracts.skillSwapMain = createContract(
        this.addresses.skillSwapMain,
        SkillSwapMainABI,
        this.signer || this.provider
      );

      this.contracts.mentorRegistry = createContract(
        this.addresses.mentorRegistry,
        MentorRegistryABI,
        this.signer || this.provider
      );

      this.contracts.sessionManager = createContract(
        this.addresses.sessionManager,
        SessionManagerABI,
        this.signer || this.provider
      );

      this.contracts.reputationSystem = createContract(
        this.addresses.reputationSystem,
        ReputationSystemABI,
        this.signer || this.provider
      );

      this.contracts.mentorshipToken = createContract(
        this.addresses.mentorshipToken,
        MentorshipTokenABI,
        this.signer || this.provider
      );

      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize contracts:", error);
      return false;
    }
  }

  /**
   * Update signer (after wallet connection or change)
   */
  public updateSigner(signer: ethers.Signer): void {
    this.signer = signer;

    // Update contracts with new signer if initialized
    if (this.initialized) {
      if (this.contracts.skillSwapMain) {
        this.contracts.skillSwapMain = this.contracts.skillSwapMain.connect(signer);
      }
      if (this.contracts.mentorRegistry) {
        this.contracts.mentorRegistry = this.contracts.mentorRegistry.connect(signer);
      }
      if (this.contracts.sessionManager) {
        this.contracts.sessionManager = this.contracts.sessionManager.connect(signer);
      }
      if (this.contracts.reputationSystem) {
        this.contracts.reputationSystem = this.contracts.reputationSystem.connect(signer);
      }
      if (this.contracts.mentorshipToken) {
        this.contracts.mentorshipToken = this.contracts.mentorshipToken.connect(signer);
      }
    }
  }

  /**
   * Check if contracts are initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get contract addresses
   */
  public getAddresses(): {
    skillSwapMain: string;
    mentorRegistry: string;
    sessionManager: string;
    reputationSystem: string;
    mentorshipToken: string;
  } {
    return { ...this.addresses };
  }

  // #region Mentor Registry Functions

  /**
   * Register as a mentor
   */
  public async registerMentor(
    name: string,
    skills: string[],
    hourlyRate: string | number,
    metadataURI: string
  ): Promise<any> {
    if (!this.initialized || !this.contracts.mentorRegistry) {
      throw new Error("Contracts not initialized");
    }

    const rate = ethers.utils.parseEther(hourlyRate.toString());
    return this.contracts.mentorRegistry.registerMentor(name, skills, rate, metadataURI);
  }

  /**
   * Update mentor profile
   */
  public async updateMentorProfile(
    name: string,
    skills: string[],
    hourlyRate: string | number,
    metadataURI: string
  ): Promise<any> {
    if (!this.initialized || !this.contracts.mentorRegistry) {
      throw new Error("Contracts not initialized");
    }

    const rate = ethers.utils.parseEther(hourlyRate.toString());
    return this.contracts.mentorRegistry.updateMentorProfile(name, skills, rate, metadataURI);
  }

  /**
   * Deactivate mentor profile
   */
  public async deactivateMentor(): Promise<any> {
    if (!this.initialized || !this.contracts.mentorRegistry) {
      throw new Error("Contracts not initialized");
    }

    return this.contracts.mentorRegistry.deactivateMentor();
  }

  /**
   * Reactivate mentor profile
   */
  public async reactivateMentor(): Promise<any> {
    if (!this.initialized || !this.contracts.mentorRegistry) {
      throw new Error("Contracts not initialized");
    }

    return this.contracts.mentorRegistry.reactivateMentor();
  }

  /**
   * Get mentor profile
   */
  public async getMentorProfile(mentorAddress: string): Promise<MentorProfile> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    // Use safeResolveAddress to prevent ENS resolution
    const safeAddress = safeResolveAddress(mentorAddress);
    
    try {
      const result = await this.contracts.mentorRegistry.getMentorProfile(safeAddress);
      
      return {
        name: result.name,
        skills: result.skills,
        hourlyRate: result.hourlyRate,
        isActive: result.isActive,
        registrationTime: result.registrationTime,
        metadataURI: result.metadataURI,
      };
    } catch (error) {
      console.error("Error getting mentor profile:", error);
      throw error;
    }
  }

  /**
   * Get all mentors
   */
  public async getAllMentors(): Promise<string[]> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    try {
      // Get mentor count
      const count = await this.contracts.mentorRegistry.getMentorCount();
      const mentors: string[] = [];
      
      // Get each mentor address
      for (let i = 0; i < count.toNumber(); i++) {
        mentors.push(await this.contracts.mentorRegistry.mentorAddresses(i));
      }
      
      return mentors;
    } catch (error) {
      console.error("Error getting all mentors:", error);
      throw error;
    }
  }

  // #endregion

  // #region Session Manager Functions

  /**
   * Request a session with a mentor
   */
  public async requestSession(
    mentorAddress: string,
    startTime: number, // Unix timestamp
    durationMinutes: number,
    topic: string
  ): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    // Use safeResolveAddress to prevent ENS resolution
    const safeAddress = safeResolveAddress(mentorAddress);
    
    try {
      const tx = await this.contracts.sessionManager.requestSession(
        safeAddress,
        startTime,
        durationMinutes,
        topic
      );
      return tx;
    } catch (error) {
      console.error("Error requesting session:", error);
      throw error;
    }
  }

  /**
   * Accept a session request (mentor only)
   */
  public async acceptSession(
    sessionId: number | string,
    meetingLink: string
  ): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    try {
      return await this.contracts.sessionManager.acceptSession(sessionId, meetingLink);
    } catch (error) {
      console.error("Error accepting session:", error);
      throw error;
    }
  }

  /**
   * Reject a session request (mentor only)
   */
  public async rejectSession(sessionId: number | string): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    try {
      return await this.contracts.sessionManager.rejectSession(sessionId);
    } catch (error) {
      console.error("Error rejecting session:", error);
      throw error;
    }
  }

  /**
   * Pay for a session (mentee only)
   */
  public async payForSession(sessionId: number | string): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    try {
      return await this.contracts.sessionManager.payForSession(sessionId);
    } catch (error) {
      console.error("Error paying for session:", error);
      throw error;
    }
  }

  /**
   * Complete a session (either mentor or mentee)
   */
  public async completeSession(sessionId: number | string): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    try {
      return await this.contracts.sessionManager.completeSession(sessionId);
    } catch (error) {
      console.error("Error completing session:", error);
      throw error;
    }
  }

  /**
   * Cancel a session (either mentor or mentee)
   */
  public async cancelSession(sessionId: number | string): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    try {
      return await this.contracts.sessionManager.cancelSession(sessionId);
    } catch (error) {
      console.error("Error canceling session:", error);
      throw error;
    }
  }

  /**
   * Get session details
   */
  public async getSession(sessionId: number | string): Promise<Session> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    try {
      const session = await this.contracts.sessionManager.getSession(sessionId);
      
      return {
        mentee: session.mentee,
        mentor: session.mentor,
        startTime: session.startTime,
        duration: session.duration,
        totalPrice: session.totalPrice,
        topic: session.topic,
        status: session.status,
        isPaid: session.isPaid,
        meetingLink: session.meetingLink
      };
    } catch (error) {
      console.error("Error getting session:", error);
      throw error;
    }
  }

  /**
   * Get all sessions for a mentor
   */
  public async getMentorSessions(mentorAddress: string): Promise<number[]> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    // Use safeResolveAddress to prevent ENS resolution
    const safeAddress = safeResolveAddress(mentorAddress);
    
    try {
      const sessionIds = await this.contracts.sessionManager.getMentorSessionIds(safeAddress);
      return sessionIds.map((id: any) => id.toNumber());
    } catch (error) {
      console.error("Error getting mentor sessions:", error);
      throw error;
    }
  }

  /**
   * Get all sessions for a mentee
   */
  public async getMenteeSessions(menteeAddress: string): Promise<number[]> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    // Use safeResolveAddress to prevent ENS resolution
    const safeAddress = safeResolveAddress(menteeAddress);
    
    try {
      const sessionIds = await this.contracts.sessionManager.getMenteeSessionIds(safeAddress);
      return sessionIds.map((id: any) => id.toNumber());
    } catch (error) {
      console.error("Error getting mentee sessions:", error);
      throw error;
    }
  }

  // #endregion

  // #region Reputation System Functions

  /**
   * Submit a rating for a session
   */
  public async submitRating(
    sessionId: number | string,
    score: number,
    comment: string
  ): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    try {
      return await this.contracts.reputationSystem.submitRating(sessionId, score, comment);
    } catch (error) {
      console.error("Error submitting rating:", error);
      throw error;
    }
  }

  /**
   * Update an existing rating
   */
  public async updateRating(
    sessionId: number | string,
    newScore: number,
    newComment: string
  ): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    try {
      return await this.contracts.reputationSystem.updateRating(sessionId, newScore, newComment);
    } catch (error) {
      console.error("Error updating rating:", error);
      throw error;
    }
  }

  /**
   * Get a mentor's average rating (returns 0-500, divide by 100 to get 0-5 stars)
   */
  public async getMentorAverageRating(mentorAddress: string): Promise<number> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }

    // Use safeResolveAddress to prevent ENS resolution
    const safeAddress = safeResolveAddress(mentorAddress);
    
    try {
      const rating = await this.contracts.reputationSystem.getMentorAverageRating(safeAddress);
      return rating.toNumber();
    } catch (error) {
      console.error("Error getting mentor average rating:", error);
      throw error;
    }
  }

  /**
   * Get mentor rating count
   */
  public async getMentorRatingCount(mentorAddress: string): Promise<number> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }

    // Use safeResolveAddress to prevent ENS resolution
    const safeAddress = safeResolveAddress(mentorAddress);
    
    try {
      const count = await this.contracts.reputationSystem.getMentorRatingCount(safeAddress);
      return count.toNumber();
    } catch (error) {
      console.error("Error getting mentor rating count:", error);
      throw error;
    }
  }

  /**
   * Get a specific rating
   */
  public async getRating(
    mentorAddress: string,
    menteeAddress: string,
    sessionId: number | string
  ): Promise<Rating> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    // Use safeResolveAddress to prevent ENS resolution
    const safeMentorAddress = safeResolveAddress(mentorAddress);
    const safeMenteeAddress = safeResolveAddress(menteeAddress);
    
    try {
      const result = await this.contracts.reputationSystem.getRating(
        safeMentorAddress,
        safeMenteeAddress,
        sessionId
      );
      
      return {
        score: result.score,
        comment: result.comment,
        timestamp: result.timestamp,
        exists: result.exists
      };
    } catch (error) {
      console.error("Error getting rating:", error);
      throw error;
    }
  }

  /**
   * Check if a session has been rated
   */
  public async isSessionRated(
    mentorAddress: string,
    sessionId: number | string
  ): Promise<boolean> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }

    // Use safeResolveAddress to prevent ENS resolution
    const safeAddress = safeResolveAddress(mentorAddress);
    
    try {
      return await this.contracts.reputationSystem.isSessionRated(safeAddress, sessionId);
    } catch (error) {
      console.error("Error checking if session is rated:", error);
      throw error;
    }
  }

  // #endregion

  // #region Token Functions

  /**
   * Get token name
   */
  public async getTokenName(): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    try {
      return await this.contracts.mentorshipToken.name();
    } catch (error) {
      console.error("Error getting token name:", error);
      throw error;
    }
  }

  /**
   * Get token symbol
   */
  public async getTokenSymbol(): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    try {
      return await this.contracts.mentorshipToken.symbol();
    } catch (error) {
      console.error("Error getting token symbol:", error);
      throw error;
    }
  }

  /**
   * Get token balance
   */
  public async getTokenBalance(address: string): Promise<string> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    // Use safeResolveAddress to prevent ENS resolution
    const safeAddress = safeResolveAddress(address);
    
    try {
      const balance = await this.contracts.mentorshipToken.balanceOf(safeAddress);
      return balance.toString();
    } catch (error) {
      console.error("Error getting token balance:", error);
      throw error;
    }
  }

  /**
   * Transfer tokens
   */
  public async transferTokens(
    to: string,
    amount: string | number
  ): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    // Use safeResolveAddress to prevent ENS resolution
    const safeAddress = safeResolveAddress(to);
    
    try {
      const parsedAmount = ethers.utils.parseEther(amount.toString());
      const tx = await this.contracts.mentorshipToken.transfer(safeAddress, parsedAmount);
      return tx;
    } catch (error) {
      console.error("Error transferring tokens:", error);
      throw error;
    }
  }

  /**
   * Approve token spending
   */
  public async approveTokens(
    spender: string,
    amount: string | number
  ): Promise<any> {
    if (!this.isInitialized()) {
      throw new Error("Contracts not initialized");
    }
    
    // Use safeResolveAddress to prevent ENS resolution
    const safeAddress = safeResolveAddress(spender);
    
    try {
      const tokenAmount = ethers.utils.parseEther(amount.toString());
      return await this.contracts.mentorshipToken.approve(safeAddress, tokenAmount);
    } catch (error) {
      console.error("Error approving tokens:", error);
      throw error;
    }
  }

  // #endregion
}

let contractsInstance: SkillSwapContracts | null = null;

/**
 * Gets or creates a contracts service instance
 */
export function getContractsInstance(
  provider: ethers.providers.Web3Provider,
  signer?: ethers.Signer
): SkillSwapContracts {
  if (!contractsInstance) {
    contractsInstance = new SkillSwapContracts(provider, signer);
  } else if (signer) {
    contractsInstance.updateSigner(signer);
  }
  
  return contractsInstance;
} 