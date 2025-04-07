// Example of integrating SkillSwap contracts with a web application

// Import necessary libraries
// For a real implementation, you would use:
// import { ethers } from "ethers";
// import { SkillSwapABIs } from "./abis";

// Contract addresses
const CONTRACT_ADDRESSES = {
  MENTORSHIP_TOKEN: "0x3bc607852393dcc75a3fccf0deb1699001d32bbd",
  MENTOR_REGISTRY: "0xcfa935f28fff8f33ee08d6fdeed91b66aff6236e",
  SESSION_MANAGER: "0xa976da47324dbb47e5bea23e8a4f3a369b42fe88",
  REPUTATION_SYSTEM: "0x74996f530fe88776d2ecef1fe301e523c55b61e5",
  SKILLSWAP_MAIN: "0x242f1c5ad353cb06034265dcbe943f816a0ba756"
};

// Setup Web3 connection
async function setupWeb3() {
  // Check if MetaMask is installed
  if (window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create ethers provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const accounts = await provider.listAccounts();
      const userAddress = accounts[0];
      
      // Check if on XDC network
      const network = await provider.getNetwork();
      if (network.chainId !== 51) {
        // If not on XDC Apothem, prompt to switch
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x33' }], // ChainId 51 in hex
          });
        } catch (switchError) {
          // If network doesn't exist in wallet, add it
          if (switchError.code === 4902) {
            await addXdcNetwork();
          } else {
            throw switchError;
          }
        }
      }
      
      // Initialize contracts
      const contracts = initializeContracts(provider, signer);
      
      return {
        provider,
        signer,
        userAddress,
        contracts
      };
    } catch (error) {
      console.error("User denied account access or another error occurred:", error);
      throw error;
    }
  } else {
    console.error("Please install MetaMask or another Ethereum wallet");
    throw new Error("No Ethereum wallet detected");
  }
}

// Initialize contract instances
function initializeContracts(provider, signer) {
  // In a real implementation, you would import ABIs
  // For example purposes, assuming ABIs are available
  return {
    mentorshipToken: new ethers.Contract(
      CONTRACT_ADDRESSES.MENTORSHIP_TOKEN,
      MentorshipTokenABI,
      signer
    ),
    mentorRegistry: new ethers.Contract(
      CONTRACT_ADDRESSES.MENTOR_REGISTRY,
      MentorRegistryABI, 
      signer
    ),
    sessionManager: new ethers.Contract(
      CONTRACT_ADDRESSES.SESSION_MANAGER,
      SessionManagerABI,
      signer
    ),
    reputationSystem: new ethers.Contract(
      CONTRACT_ADDRESSES.REPUTATION_SYSTEM,
      ReputationSystemABI,
      signer
    ),
    skillSwapMain: new ethers.Contract(
      CONTRACT_ADDRESSES.SKILLSWAP_MAIN,
      SkillSwapMainABI,
      signer
    )
  };
}

// Add XDC Network to MetaMask
async function addXdcNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x33', // 51 in decimal
        chainName: 'XDC Apothem Testnet',
        nativeCurrency: {
          name: 'XDC',
          symbol: 'XDC',
          decimals: 18
        },
        rpcUrls: ['https://rpc.apothem.network'],
        blockExplorerUrls: ['https://explorer.apothem.network']
      }]
    });
  } catch (error) {
    console.error("Failed to add XDC Network:", error);
    throw error;
  }
}

// Example: Register as a mentor
async function registerAsMentor(name, skills, hourlyRate, metadataURI) {
  try {
    const { contracts } = await setupWeb3();
    
    // Convert hourly rate to Wei (tokens use 18 decimals)
    const hourlyRateWei = ethers.utils.parseEther(hourlyRate.toString());
    
    // Call register function
    const tx = await contracts.mentorRegistry.registerMentor(
      name,
      skills,
      hourlyRateWei,
      metadataURI
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("Successfully registered as mentor! Transaction:", receipt.transactionHash);
    
    return receipt;
  } catch (error) {
    console.error("Error registering as mentor:", error);
    throw error;
  }
}

// Example: Get mentor profile
async function getMentorProfile(mentorAddress) {
  try {
    const { contracts } = await setupWeb3();
    
    // Call getMentorProfile function
    const profile = await contracts.mentorRegistry.getMentorProfile(mentorAddress);
    
    // Format the profile data
    const formattedProfile = {
      name: profile.name,
      skills: profile.skills,
      hourlyRate: ethers.utils.formatEther(profile.hourlyRate),
      isActive: profile.isActive,
      registrationTime: new Date(profile.registrationTime.toNumber() * 1000),
      metadataURI: profile.metadataURI
    };
    
    console.log("Mentor profile:", formattedProfile);
    return formattedProfile;
  } catch (error) {
    console.error("Error fetching mentor profile:", error);
    throw error;
  }
}

// Example: Request a session
async function requestMentorshipSession(mentorAddress, startTime, durationMinutes, topic) {
  try {
    const { contracts } = await setupWeb3();
    
    // Convert startTime to Unix timestamp if it's a Date object
    const startTimeUnix = startTime instanceof Date ? 
      Math.floor(startTime.getTime() / 1000) : startTime;
    
    // Request session
    const tx = await contracts.sessionManager.requestSession(
      mentorAddress,
      startTimeUnix,
      durationMinutes,
      topic
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Extract sessionId from the event
    const sessionRequestedEvent = receipt.events.find(e => e.event === 'SessionRequested');
    const sessionId = sessionRequestedEvent.args.sessionId.toNumber();
    
    console.log(`Session requested successfully! Session ID: ${sessionId}`);
    return sessionId;
  } catch (error) {
    console.error("Error requesting session:", error);
    throw error;
  }
}

// Example: Get user's token balance
async function getTokenBalance(address) {
  try {
    const { contracts } = await setupWeb3();
    const balance = await contracts.mentorshipToken.balanceOf(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error("Error getting token balance:", error);
    throw error;
  }
}

// Export functions for use in application
const SkillSwapSDK = {
  setupWeb3,
  registerAsMentor,
  getMentorProfile,
  requestMentorshipSession,
  getTokenBalance
  // Add more functions as needed
};

// In a real implementation, you would export this SDK:
// export default SkillSwapSDK; 