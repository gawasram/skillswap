# MentorshipToken (ROXN)

The MentorshipToken (ROXN) is an ERC20 token that powers the SkillSwap platform's payment system.

## Contract Address

**XDC Apothem Testnet**: [`0x3bc607852393dcc75a3fccf0deb1699001d32bbd`](https://explorer.apothem.network/address/0x3bc607852393dcc75a3fccf0deb1699001d32bbd)

## Overview

MentorshipToken (ROXN) is used for:
- Paying mentors for their sessions
- Platform fees
- Potential future governance mechanisms

## Key Features

- **Fixed Maximum Supply**: 100 million ROXN tokens
- **Initial Supply**: 10 million ROXN tokens minted to contract deployer
- **Pausable**: In emergency situations, token transfers can be paused
- **Session Payments**: Special function for session payment processing

## Main Functions

### `mint(address to, uint256 amount)`

Mints new tokens to the specified address (owner only).

**Parameters:**
- `to`: Address to receive the tokens
- `amount`: Amount of tokens to mint

**Requirements:**
- Caller must be the contract owner
- Total supply after minting must not exceed maximum supply

### `processSessionPayment(address mentor, address mentee, uint256 amount)`

Transfers tokens from mentee to mentor for a completed session.

**Parameters:**
- `mentor`: Address of the mentor to receive payment
- `mentee`: Address of the mentee making the payment
- `amount`: Amount of tokens for the session

**Requirements:**
- Contract must not be paused
- Mentor and mentee addresses must be valid
- Amount must be greater than zero

### `pause()` and `unpause()`

Pauses and unpauses token transfers (owner only).

## Events

### `SessionPayment`

Emitted when a session payment is processed.

**Parameters:**
- `mentor`: Address of the mentor
- `mentee`: Address of the mentee
- `amount`: Amount of tokens transferred

## Usage Examples

### Making a Session Payment

```javascript
// Example using ethers.js
const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);

// Approve token transfer first (by mentee)
await tokenContract.approve(sessionManagerAddress, paymentAmount);

// Process payment through SessionManager
await sessionManager.confirmPayment(sessionId);
```

## Security Considerations

- Minting authority is centralized with the contract owner
- Pausable functionality creates centralization risk but serves as emergency protection 