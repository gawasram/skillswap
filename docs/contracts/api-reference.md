# SkillSwap Contract API Reference

This document provides a complete API reference for all SkillSwap smart contracts.

## MentorshipToken

### Functions

#### `constructor()`
Initializes the token with name "SkillSwap Token" and symbol "ROXN".
Mints 10 million tokens to the contract deployer.

#### `mint(address to, uint256 amount) → external`
Mints new tokens to the specified address.
- **Requirements**: Caller must be the contract owner
- **Parameters**:
  - `to`: Address to receive the tokens
  - `amount`: Amount of tokens to mint

#### `processSessionPayment(address mentor, address mentee, uint256 amount) → external → bool`
Transfers tokens from mentee to mentor for a completed session.
- **Parameters**:
  - `mentor`: Address of the mentor
  - `mentee`: Address of the mentee
  - `amount`: Amount of tokens to transfer
- **Returns**: Boolean indicating success

#### `pause() → external`
Pauses token transfers.
- **Requirements**: Caller must be the contract owner

#### `unpause() → external`
Unpauses token transfers.
- **Requirements**: Caller must be the contract owner

### Events

#### `SessionPayment(address indexed mentor, address indexed mentee, uint256 amount)`
Emitted when tokens are used for a mentorship session.

## MentorRegistry

### Functions

#### `constructor()`
Initializes the mentor registry contract.

#### `registerMentor(string name, string[] skills, uint256 hourlyRate, string metadataURI) → external`
Registers a new mentor.
- **Parameters**:
  - `name`: Mentor's name
  - `skills`: Array of skills offered
  - `hourlyRate`: Rate in tokens per hour
  - `metadataURI`: IPFS URI for additional profile data

#### `updateMentorProfile(string name, string[] skills, uint256 hourlyRate, string metadataURI) → external`
Updates an existing mentor profile.
- **Requirements**: Caller must be a registered mentor
- **Parameters**: Same as `registerMentor`

#### `deactivateMentor() → external`
Temporarily deactivates a mentor profile.
- **Requirements**: Caller must be a registered active mentor

#### `reactivateMentor() → external`
Reactivates a deactivated mentor profile.
- **Requirements**: Caller must be previously registered but not active

#### `getMentorProfile(address mentorAddress) → external view → (string name, string[] skills, uint256 hourlyRate, bool isActive, uint256 registrationTime, string metadataURI)`
Gets a mentor's profile details.
- **Parameters**:
  - `mentorAddress`: Address of the mentor
- **Returns**: Mentor profile details

#### `getMentorCount() → external view → uint256`
Gets the total number of mentors registered.
- **Returns**: Number of mentors

### Events

#### `MentorRegistered(address indexed mentorAddress, string name, uint256 hourlyRate)`
Emitted when a new mentor registers.

#### `MentorUpdated(address indexed mentorAddress, string name, uint256 hourlyRate)`
Emitted when a mentor updates their profile.

#### `MentorDeactivated(address indexed mentorAddress)`
Emitted when a mentor deactivates their profile.

#### `MentorReactivated(address indexed mentorAddress)`
Emitted when a mentor reactivates their profile.

## Additional Contract APIs

Similar API documentation should be created for:
- SessionManager
- ReputationSystem
- SkillSwapMain

Each function should include:
- Function signature
- Description
- Parameters
- Return values
- Requirements/preconditions
- Examples of use (where helpful) 