// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MentorshipToken.sol";
import "./MentorRegistry.sol";
import "./SessionManager.sol";
import "./ReputationSystem.sol";

/**
 * @title SkillSwapMain
 * @dev Main contract that connects all SkillSwap platform components
 */
contract SkillSwapMain is Ownable {
    // Contract references
    MentorshipToken public token;
    MentorRegistry public mentorRegistry;
    SessionManager public sessionManager;
    ReputationSystem public reputationSystem;
    
    // Platform fee percentage (in basis points, e.g. 250 = 2.5%)
    uint256 public platformFeeRate = 250;
    
    // Treasury address to collect platform fees
    address public treasuryAddress;
    
    // Events
    event ContractsDeployed(
        address tokenAddress, 
        address mentorRegistryAddress, 
        address sessionManagerAddress, 
        address reputationSystemAddress
    );
    event PlatformFeeUpdated(uint256 newFeeRate);
    event TreasuryAddressUpdated(address newTreasuryAddress);
    
    constructor() {
        treasuryAddress = msg.sender; // Initially set to contract deployer
        
        // Deploy all contracts
        token = new MentorshipToken();
        mentorRegistry = new MentorRegistry();
        sessionManager = new SessionManager(address(mentorRegistry), address(token));
        reputationSystem = new ReputationSystem(address(sessionManager));
        
        emit ContractsDeployed(
            address(token), 
            address(mentorRegistry), 
            address(sessionManager), 
            address(reputationSystem)
        );
    }
    
    /**
     * @dev Update the platform fee rate
     * @param newFeeRate New fee rate in basis points (e.g. 250 = 2.5%)
     */
    function updatePlatformFeeRate(uint256 newFeeRate) external onlyOwner {
        require(newFeeRate <= 1000, "Fee rate cannot exceed 10%");
        platformFeeRate = newFeeRate;
        emit PlatformFeeUpdated(newFeeRate);
    }
    
    /**
     * @dev Update the treasury address
     * @param newTreasuryAddress New address to collect platform fees
     */
    function updateTreasuryAddress(address newTreasuryAddress) external onlyOwner {
        require(newTreasuryAddress != address(0), "Invalid treasury address");
        treasuryAddress = newTreasuryAddress;
        emit TreasuryAddressUpdated(newTreasuryAddress);
    }
    
    /**
     * @dev Get all platform contract addresses
     */
    function getContractAddresses() external view returns (
        address tokenAddress,
        address mentorRegistryAddress,
        address sessionManagerAddress,
        address reputationSystemAddress
    ) {
        return (
            address(token),
            address(mentorRegistry),
            address(sessionManager),
            address(reputationSystem)
        );
    }
} 