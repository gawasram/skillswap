# SkillSwap Smart Contracts

This directory contains the Ethereum smart contracts that power the SkillSwap platform.

## Contract Architecture

- **MentorshipToken.sol** - ERC20 token for session payments
- **MentorRegistry.sol** - Manages mentor profiles and skills
- **SessionManager.sol** - Handles session booking and management
- **ReputationSystem.sol** - Tracks mentor ratings and reviews
- **SkillSwapMain.sol** - Main contract that connects all components

## Deployed Contracts (XDC Apothem Testnet)

The contracts have been successfully deployed to the XDC Apothem Testnet:

| Contract | Address |
|----------|---------|
| MentorshipToken | 0x3bc607852393dcc75a3fccf0deb1699001d32bbd |
| MentorRegistry | 0xcfa935f28fff8f33ee08d6fdeed91b66aff6236e |
| SessionManager | 0xa976da47324dbb47e5bea23e8a4f3a369b42fe88 |
| ReputationSystem | 0x74996f530fe88776d2ecef1fe301e523c55b61e5 |
| SkillSwapMain | 0x242f1c5ad353cb06034265dcbe943f816a0ba756 |

## Development

### Prerequisites

- Node.js 18+
- npm/yarn
- Hardhat

### Setup

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### Deployment

The contracts can be deployed using either Hardhat Ignition or a standard Hardhat script:

#### Using Hardhat Ignition

```bash
# Deploy to local network
npx hardhat ignition deploy ./ignition/modules/deploy.ts

# Deploy to XDC Testnet
npx hardhat ignition deploy ./ignition/modules/deploy.ts --network xdcTestnet
```

#### Using Standard Hardhat Script

```bash
# Deploy to local network
npx hardhat run scripts/deploy.ts

# Deploy to XDC Testnet
npx hardhat run scripts/deploy.ts --network xdcTestnet
```

## Contract Interactions

### Mentor Flow

1. Register as a mentor (MentorRegistry)
2. Accept session requests (SessionManager)
3. Complete sessions (SessionManager)
4. Receive tokens and ratings (MentorshipToken, ReputationSystem)

### Mentee Flow

1. Request mentorship sessions (SessionManager)
2. Pay for sessions with tokens (MentorshipToken)
3. Complete sessions (SessionManager)
4. Rate mentors (ReputationSystem)

## Contract Verification

To verify contracts on the XDC Apothem Testnet explorer:

1. Visit [Apothem Explorer](https://explorer.apothem.network/)
2. Search for the contract address
3. Go to the "Contract" tab
4. Click "Verify & Publish"
5. Enter the Solidity compiler version (0.8.17)
6. Upload the contract source code
7. Complete the verification process

## Security

These contracts follow security best practices including:
- Using OpenZeppelin's battle-tested contracts
- Implementing reentrancy protection
- Access control mechanisms
- Comprehensive testing

## Testing

All contracts include comprehensive test suites. Run them with:

```bash
npm test
```

## Optimization

Contract gas optimization techniques used:
- Efficient data structures
- Avoiding unnecessary storage operations
- Gas-efficient patterns 