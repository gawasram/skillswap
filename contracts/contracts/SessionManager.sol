// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./MentorRegistry.sol";
import "./MentorshipToken.sol";

/**
 * @title SessionManager
 * @dev Contract for managing mentorship sessions on the SkillSwap platform
 */
contract SessionManager is Ownable, ReentrancyGuard {
    // Session statuses
    enum SessionStatus { Requested, Accepted, Rejected, Completed, Cancelled }
    
    // Session structure
    struct Session {
        address mentee;
        address mentor;
        uint256 startTime;
        uint256 duration; // in minutes
        uint256 totalPrice;
        string topic;
        SessionStatus status;
        bool isPaid;
        string meetingLink;
    }
    
    // Session ID counter
    uint256 private _sessionIdCounter;
    
    // Sessions mapping
    mapping(uint256 => Session) public sessions;
    
    // Mentor to session IDs mapping
    mapping(address => uint256[]) public mentorSessions;
    
    // Mentee to session IDs mapping
    mapping(address => uint256[]) public menteeSessions;
    
    // Contract references
    MentorRegistry public mentorRegistry;
    MentorshipToken public token;
    
    // Events
    event SessionRequested(uint256 indexed sessionId, address indexed mentee, address indexed mentor, uint256 startTime);
    event SessionAccepted(uint256 indexed sessionId, address indexed mentor, string meetingLink);
    event SessionRejected(uint256 indexed sessionId, address indexed mentor);
    event SessionCompleted(uint256 indexed sessionId);
    event SessionCancelled(uint256 indexed sessionId, address indexed cancellor);
    event PaymentProcessed(uint256 indexed sessionId, uint256 amount);
    
    constructor(address mentorRegistryAddress, address tokenAddress) {
        mentorRegistry = MentorRegistry(mentorRegistryAddress);
        token = MentorshipToken(tokenAddress);
        _sessionIdCounter = 1;
    }
    
    /**
     * @dev Request a mentorship session
     * @param mentor Address of the mentor
     * @param startTime Unix timestamp for session start
     * @param duration Duration in minutes
     * @param topic Topic for the session
     */
    function requestSession(
        address mentor,
        uint256 startTime,
        uint256 duration,
        string memory topic
    ) external nonReentrant returns (uint256) {
        require(mentor != address(0), "Invalid mentor address");
        require(startTime > block.timestamp, "Start time must be in the future");
        require(duration > 0, "Duration must be greater than 0");
        require(bytes(topic).length > 0, "Topic cannot be empty");
        
        // Get mentor profile and verify it's active
        (,,uint256 hourlyRate, bool isActive,,) = mentorRegistry.getMentorProfile(mentor);
        require(isActive, "Mentor is not active");
        
        // Calculate total price
        uint256 totalPrice = (hourlyRate * duration) / 60; // Convert to minutes pricing
        
        // Create session
        uint256 sessionId = _sessionIdCounter++;
        sessions[sessionId] = Session({
            mentee: msg.sender,
            mentor: mentor,
            startTime: startTime,
            duration: duration,
            totalPrice: totalPrice,
            topic: topic,
            status: SessionStatus.Requested,
            isPaid: false,
            meetingLink: ""
        });
        
        // Update mappings
        mentorSessions[mentor].push(sessionId);
        menteeSessions[msg.sender].push(sessionId);
        
        emit SessionRequested(sessionId, msg.sender, mentor, startTime);
        return sessionId;
    }
    
    /**
     * @dev Accept a session request
     * @param sessionId ID of the session to accept
     * @param meetingLink Link for the virtual meeting
     */
    function acceptSession(uint256 sessionId, string memory meetingLink) external nonReentrant {
        Session storage session = sessions[sessionId];
        
        require(session.mentor == msg.sender, "Only the mentor can accept the session");
        require(session.status == SessionStatus.Requested, "Session is not in requested state");
        require(bytes(meetingLink).length > 0, "Meeting link cannot be empty");
        
        session.status = SessionStatus.Accepted;
        session.meetingLink = meetingLink;
        
        emit SessionAccepted(sessionId, msg.sender, meetingLink);
    }
    
    /**
     * @dev Reject a session request
     * @param sessionId ID of the session to reject
     */
    function rejectSession(uint256 sessionId) external nonReentrant {
        Session storage session = sessions[sessionId];
        
        require(session.mentor == msg.sender, "Only the mentor can reject the session");
        require(session.status == SessionStatus.Requested, "Session is not in requested state");
        
        session.status = SessionStatus.Rejected;
        
        emit SessionRejected(sessionId, msg.sender);
    }
    
    /**
     * @dev Pay for a session
     * @param sessionId ID of the session to pay for
     */
    function payForSession(uint256 sessionId) external nonReentrant {
        Session storage session = sessions[sessionId];
        
        require(session.mentee == msg.sender, "Only the mentee can pay for the session");
        require(session.status == SessionStatus.Accepted, "Session must be accepted first");
        require(!session.isPaid, "Session is already paid for");
        
        // Process payment
        bool success = token.processSessionPayment(session.mentor, msg.sender, session.totalPrice);
        require(success, "Payment failed");
        
        session.isPaid = true;
        
        emit PaymentProcessed(sessionId, session.totalPrice);
    }
    
    /**
     * @dev Complete a session
     * @param sessionId ID of the session to complete
     */
    function completeSession(uint256 sessionId) external nonReentrant {
        Session storage session = sessions[sessionId];
        
        // Either mentor or mentee can mark as completed
        require(
            session.mentor == msg.sender || session.mentee == msg.sender,
            "Only the mentor or mentee can complete the session"
        );
        require(session.status == SessionStatus.Accepted, "Session must be accepted");
        require(session.isPaid, "Session must be paid for");
        require(block.timestamp >= session.startTime, "Session has not started yet");
        
        session.status = SessionStatus.Completed;
        
        emit SessionCompleted(sessionId);
    }
    
    /**
     * @dev Cancel a session
     * @param sessionId ID of the session to cancel
     */
    function cancelSession(uint256 sessionId) external nonReentrant {
        Session storage session = sessions[sessionId];
        
        // Either mentor or mentee can cancel
        require(
            session.mentor == msg.sender || session.mentee == msg.sender,
            "Only the mentor or mentee can cancel the session"
        );
        require(
            session.status == SessionStatus.Requested || session.status == SessionStatus.Accepted,
            "Session cannot be cancelled in its current state"
        );
        
        // If already paid, refund the mentee
        if (session.isPaid) {
            bool success = token.processSessionPayment(session.mentee, session.mentor, session.totalPrice);
            require(success, "Refund failed");
            session.isPaid = false;
        }
        
        session.status = SessionStatus.Cancelled;
        
        emit SessionCancelled(sessionId, msg.sender);
    }
    
    /**
     * @dev Get a session's details
     * @param sessionId ID of the session
     */
    function getSession(uint256 sessionId) external view returns (
        address mentee,
        address mentor,
        uint256 startTime,
        uint256 duration,
        uint256 totalPrice,
        string memory topic,
        SessionStatus status,
        bool isPaid,
        string memory meetingLink
    ) {
        Session storage session = sessions[sessionId];
        return (
            session.mentee,
            session.mentor,
            session.startTime,
            session.duration,
            session.totalPrice,
            session.topic,
            session.status,
            session.isPaid,
            session.meetingLink
        );
    }
    
    /**
     * @dev Get all session IDs for a mentor
     * @param mentor Address of the mentor
     */
    function getMentorSessionIds(address mentor) external view returns (uint256[] memory) {
        return mentorSessions[mentor];
    }
    
    /**
     * @dev Get all session IDs for a mentee
     * @param mentee Address of the mentee
     */
    function getMenteeSessionIds(address mentee) external view returns (uint256[] memory) {
        return menteeSessions[mentee];
    }
} 