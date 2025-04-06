// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MentorshipToken
 * @dev ERC20 Token for the SkillSwap platform, used for session payments
 */
contract MentorshipToken is ERC20, Ownable, Pausable {
    // Event emitted when tokens are used for a mentorship session
    event SessionPayment(address indexed mentor, address indexed mentee, uint256 amount);
    
    // Maximum token supply
    uint256 public constant MAX_SUPPLY = 100000000 * 10**18; // 100 million tokens
    
    constructor() ERC20("SkillSwap Token", "ROXN") {
        // Mint initial supply to contract creator
        _mint(msg.sender, 10000000 * 10**18); // 10 million tokens initially
    }
    
    /**
     * @dev Mint new tokens (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds maximum token supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Process payment for a mentorship session
     * @param mentor Address of the mentor
     * @param mentee Address of the mentee
     * @param amount Amount of tokens for the session
     */
    function processSessionPayment(address mentor, address mentee, uint256 amount) 
        external 
        whenNotPaused 
        returns (bool) 
    {
        require(mentor != address(0), "Invalid mentor address");
        require(mentee != address(0), "Invalid mentee address");
        require(amount > 0, "Payment amount must be greater than 0");
        
        // Transfer tokens from mentee to mentor
        _transfer(mentee, mentor, amount);
        
        emit SessionPayment(mentor, mentee, amount);
        return true;
    }
    
    /**
     * @dev Pause token transfers (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override _beforeTokenTransfer to check paused state
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20) whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
} 