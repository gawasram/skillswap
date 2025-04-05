/**
 * Contract ABIs for SkillSwap platform
 * 
 * These ABIs are needed to interact with the smart contracts
 */

// SkillSwap Main Contract ABI
export const SkillSwapMainABI = [
  // Read functions
  "function token() view returns (address)",
  "function mentorRegistry() view returns (address)",
  "function sessionManager() view returns (address)",
  "function reputationSystem() view returns (address)",
  "function platformFeeRate() view returns (uint256)",
  "function treasuryAddress() view returns (address)",
  "function getContractAddresses() view returns (address tokenAddress, address mentorRegistryAddress, address sessionManagerAddress, address reputationSystemAddress)",
  
  // Write functions
  "function updatePlatformFeeRate(uint256 newFeeRate)",
  "function updateTreasuryAddress(address newTreasuryAddress)",
  
  // Events
  "event ContractsDeployed(address tokenAddress, address mentorRegistryAddress, address sessionManagerAddress, address reputationSystemAddress)",
  "event PlatformFeeUpdated(uint256 newFeeRate)",
  "event TreasuryAddressUpdated(address newTreasuryAddress)"
];

// Mentor Registry Contract ABI
export const MentorRegistryABI = [
  // Read functions
  "function mentors(address) view returns (string name, bool isActive, uint256 registrationTime, string metadataURI)",
  "function mentorAddresses(uint256) view returns (address)",
  "function getMentorProfile(address mentorAddress) view returns (string name, string[] skills, uint256 hourlyRate, bool isActive, uint256 registrationTime, string metadataURI)",
  "function getMentorCount() view returns (uint256)",
  
  // Write functions
  "function registerMentor(string memory name, string[] memory skills, uint256 hourlyRate, string memory metadataURI)",
  "function updateMentorProfile(string memory name, string[] memory skills, uint256 hourlyRate, string memory metadataURI)",
  "function deactivateMentor()",
  "function reactivateMentor()",
  
  // Events
  "event MentorRegistered(address indexed mentorAddress, string name, uint256 hourlyRate)",
  "event MentorUpdated(address indexed mentorAddress, string name, uint256 hourlyRate)",
  "event MentorDeactivated(address indexed mentorAddress)",
  "event MentorReactivated(address indexed mentorAddress)"
];

// Session Manager Contract ABI
export const SessionManagerABI = [
  // Read functions
  "function sessions(uint256) view returns (address mentee, address mentor, uint256 startTime, uint256 duration, uint256 totalPrice, string topic, uint8 status, bool isPaid, string meetingLink)",
  "function mentorSessions(address, uint256) view returns (uint256)",
  "function menteeSessions(address, uint256) view returns (uint256)",
  "function getSession(uint256 sessionId) view returns (address mentee, address mentor, uint256 startTime, uint256 duration, uint256 totalPrice, string topic, uint8 status, bool isPaid, string meetingLink)",
  "function getMentorSessionIds(address mentor) view returns (uint256[] memory)",
  "function getMenteeSessionIds(address mentee) view returns (uint256[] memory)",
  
  // Write functions
  "function requestSession(address mentor, uint256 startTime, uint256 duration, string memory topic) returns (uint256)",
  "function acceptSession(uint256 sessionId, string memory meetingLink)",
  "function rejectSession(uint256 sessionId)",
  "function payForSession(uint256 sessionId)",
  "function completeSession(uint256 sessionId)",
  "function cancelSession(uint256 sessionId)",
  
  // Events
  "event SessionRequested(uint256 indexed sessionId, address indexed mentee, address indexed mentor, uint256 startTime)",
  "event SessionAccepted(uint256 indexed sessionId, address indexed mentor, string meetingLink)",
  "event SessionRejected(uint256 indexed sessionId, address indexed mentor)",
  "event SessionCompleted(uint256 indexed sessionId)",
  "event SessionCancelled(uint256 indexed sessionId, address indexed cancellor)",
  "event PaymentProcessed(uint256 indexed sessionId, uint256 amount)"
];

// Reputation System Contract ABI
export const ReputationSystemABI = [
  // Read functions
  "function getMentorAverageRating(address mentor) view returns (uint256 averageRating)",
  "function getMentorRatingCount(address mentor) view returns (uint256 ratingCount)",
  "function getRating(address mentor, address mentee, uint256 sessionId) view returns (uint8 score, string memory comment, uint256 timestamp, bool exists)",
  "function isSessionRated(address mentor, uint256 sessionId) view returns (bool isRated)",
  
  // Write functions
  "function submitRating(uint256 sessionId, uint8 score, string memory comment)",
  "function updateRating(uint256 sessionId, uint8 newScore, string memory newComment)",
  
  // Events
  "event RatingSubmitted(address indexed mentor, address indexed mentee, uint256 indexed sessionId, uint8 score)",
  "event RatingUpdated(address indexed mentor, address indexed mentee, uint256 indexed sessionId, uint8 score)"
];

// Mentorship Token (ERC20) Contract ABI
export const MentorshipTokenABI = [
  // Standard ERC20 functions
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  
  // Custom functions
  "function MAX_SUPPLY() view returns (uint256)",
  "function mint(address to, uint256 amount)",
  "function processSessionPayment(address mentor, address mentee, uint256 amount) returns (bool)",
  "function pause()",
  "function unpause()",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event SessionPayment(address indexed mentor, address indexed mentee, uint256 amount)"
];

// Enum for SessionStatus 
export enum SessionStatus {
  Requested = 0,
  Accepted = 1,
  Rejected = 2,
  Completed = 3,
  Cancelled = 4
} 