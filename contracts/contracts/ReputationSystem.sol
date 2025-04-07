// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./SessionManager.sol";

/**
 * @title ReputationSystem
 * @dev Contract for managing mentor ratings and reputation
 */
contract ReputationSystem is Ownable, ReentrancyGuard {
    // Rating structure
    struct Rating {
        uint8 score; // 1-5 stars
        string comment;
        uint256 timestamp;
        bool exists;
    }
    
    // Mentor reputation structure
    struct Reputation {
        uint256 totalScore;
        uint256 ratingCount;
        mapping(uint256 => bool) sessionRated; // Session ID to rating status
        mapping(address => mapping(uint256 => Rating)) ratings; // Mentee to session ID to rating
    }
    
    // Mapping from mentor address to their reputation
    mapping(address => Reputation) private mentorReputations;
    
    // Reference to session manager contract
    SessionManager public sessionManager;
    
    // Events
    event RatingSubmitted(address indexed mentor, address indexed mentee, uint256 indexed sessionId, uint8 score);
    event RatingUpdated(address indexed mentor, address indexed mentee, uint256 indexed sessionId, uint8 score);
    
    constructor(address sessionManagerAddress) {
        sessionManager = SessionManager(sessionManagerAddress);
    }
    
    /**
     * @dev Submit a rating for a completed session
     * @param sessionId ID of the completed session
     * @param score Rating score (1-5)
     * @param comment Optional comment
     */
    function submitRating(uint256 sessionId, uint8 score, string memory comment) external nonReentrant {
        // Validate score
        require(score >= 1 && score <= 5, "Score must be between 1 and 5");
        
        // Get session details
        (address mentee, address mentor, , , , , SessionManager.SessionStatus status, , ) = sessionManager.getSession(sessionId);
        
        // Verify session is completed and mentee is the caller
        require(status == SessionManager.SessionStatus.Completed, "Session must be completed");
        require(mentee == msg.sender, "Only the mentee can rate the session");
        
        // Verify session hasn't been rated already
        require(!mentorReputations[mentor].sessionRated[sessionId], "Session already rated");
        
        // Create a new rating
        Rating memory newRating = Rating({
            score: score,
            comment: comment,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Update mentor's reputation
        Reputation storage rep = mentorReputations[mentor];
        rep.totalScore += score;
        rep.ratingCount++;
        rep.sessionRated[sessionId] = true;
        rep.ratings[msg.sender][sessionId] = newRating;
        
        emit RatingSubmitted(mentor, msg.sender, sessionId, score);
    }
    
    /**
     * @dev Update an existing rating
     * @param sessionId ID of the previously rated session
     * @param newScore Updated rating score (1-5)
     * @param newComment Updated comment
     */
    function updateRating(uint256 sessionId, uint8 newScore, string memory newComment) external nonReentrant {
        // Validate score
        require(newScore >= 1 && newScore <= 5, "Score must be between 1 and 5");
        
        // Get session details
        (address mentee, address mentor, , , , , , , ) = sessionManager.getSession(sessionId);
        
        // Verify mentee is the caller
        require(mentee == msg.sender, "Only the mentee can update their rating");
        
        // Verify session has been rated
        require(mentorReputations[mentor].sessionRated[sessionId], "Session not yet rated");
        
        // Get the existing rating
        Rating storage existingRating = mentorReputations[mentor].ratings[msg.sender][sessionId];
        require(existingRating.exists, "Rating does not exist");
        
        // Update mentor's reputation score
        Reputation storage rep = mentorReputations[mentor];
        rep.totalScore = rep.totalScore - existingRating.score + newScore;
        
        // Update the rating
        existingRating.score = newScore;
        existingRating.comment = newComment;
        existingRating.timestamp = block.timestamp;
        
        emit RatingUpdated(mentor, msg.sender, sessionId, newScore);
    }
    
    /**
     * @dev Get a mentor's average rating
     * @param mentor Address of the mentor
     * @return averageRating The average rating as percentage (0 if no ratings)
     */
    function getMentorAverageRating(address mentor) external view returns (uint256 averageRating) {
        Reputation storage rep = mentorReputations[mentor];
        if (rep.ratingCount == 0) {
            return 0;
        }
        return (rep.totalScore * 100) / rep.ratingCount; // Return as percentage (e.g. 450 for 4.5 stars)
    }
    
    /**
     * @dev Get a mentor's rating count
     * @param mentor Address of the mentor
     * @return ratingCount Total number of ratings
     */
    function getMentorRatingCount(address mentor) external view returns (uint256 ratingCount) {
        return mentorReputations[mentor].ratingCount;
    }
    
    /**
     * @dev Get a specific rating for a mentor by session
     * @param mentor Address of the mentor
     * @param mentee Address of the mentee who gave the rating
     * @param sessionId ID of the session
     * @return score The rating score
     * @return comment The rating comment
     * @return timestamp When the rating was submitted
     * @return exists Whether the rating exists
     */
    function getRating(address mentor, address mentee, uint256 sessionId) 
        external 
        view 
        returns (
            uint8 score,
            string memory comment,
            uint256 timestamp,
            bool exists
        ) 
    {
        Rating memory rating = mentorReputations[mentor].ratings[mentee][sessionId];
        return (
            rating.score,
            rating.comment,
            rating.timestamp,
            rating.exists
        );
    }
    
    /**
     * @dev Check if a session has been rated
     * @param mentor Address of the mentor
     * @param sessionId ID of the session
     * @return isRated Boolean indicating if the session has been rated
     */
    function isSessionRated(address mentor, uint256 sessionId) external view returns (bool isRated) {
        return mentorReputations[mentor].sessionRated[sessionId];
    }
} 