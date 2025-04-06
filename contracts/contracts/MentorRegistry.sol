// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MentorRegistry
 * @dev Contract for managing mentor profiles on the SkillSwap platform
 */
contract MentorRegistry is Ownable, ReentrancyGuard {
    // Struct to store mentor information
    struct MentorProfile {
        string name;
        string[] skills;
        uint256 hourlyRate;
        bool isActive;
        uint256 registrationTime;
        string metadataURI; // IPFS URI for additional profile data
    }
    
    // Mapping from address to mentor profile
    mapping(address => MentorProfile) public mentors;
    
    // Array to keep track of all mentor addresses
    address[] public mentorAddresses;
    
    // Events
    event MentorRegistered(address indexed mentorAddress, string name, uint256 hourlyRate);
    event MentorUpdated(address indexed mentorAddress, string name, uint256 hourlyRate);
    event MentorDeactivated(address indexed mentorAddress);
    event MentorReactivated(address indexed mentorAddress);
    
    // Modifiers
    modifier onlyRegisteredMentor() {
        require(mentors[msg.sender].isActive, "Not a registered active mentor");
        _;
    }
    
    constructor() {}
    
    /**
     * @dev Register as a new mentor
     * @param name Mentor's name
     * @param skills Array of skills offered
     * @param hourlyRate Rate in tokens per hour
     * @param metadataURI IPFS URI for additional profile data
     */
    function registerMentor(
        string memory name,
        string[] memory skills,
        uint256 hourlyRate,
        string memory metadataURI
    ) external nonReentrant {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(skills.length > 0, "Must provide at least one skill");
        require(hourlyRate > 0, "Hourly rate must be greater than 0");
        require(!mentors[msg.sender].isActive, "Already registered as an active mentor");
        
        mentors[msg.sender] = MentorProfile({
            name: name,
            skills: skills,
            hourlyRate: hourlyRate,
            isActive: true,
            registrationTime: block.timestamp,
            metadataURI: metadataURI
        });
        
        mentorAddresses.push(msg.sender);
        
        emit MentorRegistered(msg.sender, name, hourlyRate);
    }
    
    /**
     * @dev Update mentor profile
     * @param name Updated name
     * @param skills Updated array of skills
     * @param hourlyRate Updated hourly rate
     * @param metadataURI Updated IPFS URI
     */
    function updateMentorProfile(
        string memory name,
        string[] memory skills,
        uint256 hourlyRate,
        string memory metadataURI
    ) external onlyRegisteredMentor {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(skills.length > 0, "Must provide at least one skill");
        require(hourlyRate > 0, "Hourly rate must be greater than 0");
        
        MentorProfile storage profile = mentors[msg.sender];
        profile.name = name;
        profile.skills = skills;
        profile.hourlyRate = hourlyRate;
        profile.metadataURI = metadataURI;
        
        emit MentorUpdated(msg.sender, name, hourlyRate);
    }
    
    /**
     * @dev Deactivate mentor profile
     */
    function deactivateMentor() external onlyRegisteredMentor {
        mentors[msg.sender].isActive = false;
        emit MentorDeactivated(msg.sender);
    }
    
    /**
     * @dev Reactivate mentor profile
     */
    function reactivateMentor() external nonReentrant {
        require(bytes(mentors[msg.sender].name).length > 0, "Not previously registered");
        require(!mentors[msg.sender].isActive, "Mentor is already active");
        
        mentors[msg.sender].isActive = true;
        emit MentorReactivated(msg.sender);
    }
    
    /**
     * @dev Get mentor profile
     * @param mentorAddress Address of the mentor
     * @return name The mentor's name
     * @return skills Array of mentor's skills
     * @return hourlyRate Mentor's hourly rate
     * @return isActive Whether mentor is currently active
     * @return registrationTime When mentor registered
     * @return metadataURI IPFS URI for additional data
     */
    function getMentorProfile(address mentorAddress) 
        external 
        view 
        returns (
            string memory name,
            string[] memory skills,
            uint256 hourlyRate,
            bool isActive,
            uint256 registrationTime,
            string memory metadataURI
        ) 
    {
        MentorProfile storage profile = mentors[mentorAddress];
        return (
            profile.name,
            profile.skills,
            profile.hourlyRate,
            profile.isActive,
            profile.registrationTime,
            profile.metadataURI
        );
    }
    
    /**
     * @dev Get total number of mentors registered
     * @return Number of mentors
     */
    function getMentorCount() external view returns (uint256) {
        return mentorAddresses.length;
    }
} 