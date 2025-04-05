# SkillSwap Smart Contracts Documentation

This documentation covers the smart contracts that power the SkillSwap platform, a decentralized peer-to-peer skill sharing and mentorship marketplace built on XDC Network.

## Contract Architecture

The SkillSwap platform consists of five main contracts that work together:

![SkillSwap Contract Architecture](../images/contract-architecture.png)

### Core Contracts

1. **MentorshipToken (ROXN)** - ERC20 token used for platform payments
2. **MentorRegistry** - Manages mentor profiles and skills
3. **SessionManager** - Handles session booking and management
4. **ReputationSystem** - Tracks mentor ratings and reputation
5. **SkillSwapMain** - Connects all components and manages platform settings

## Deployed Contracts (XDC Apothem Testnet)

| Contract | Address | Explorer Link |
|----------|---------|---------------|
| MentorshipToken | 0x3bc607852393dcc75a3fccf0deb1699001d32bbd | [View on Explorer](https://explorer.apothem.network/address/0x3bc607852393dcc75a3fccf0deb1699001d32bbd) |
| MentorRegistry | 0xcfa935f28fff8f33ee08d6fdeed91b66aff6236e | [View on Explorer](https://explorer.apothem.network/address/0xcfa935f28fff8f33ee08d6fdeed91b66aff6236e) |
| SessionManager | 0xa976da47324dbb47e5bea23e8a4f3a369b42fe88 | [View on Explorer](https://explorer.apothem.network/address/0xa976da47324dbb47e5bea23e8a4f3a369b42fe88) |
| ReputationSystem | 0x74996f530fe88776d2ecef1fe301e523c55b61e5 | [View on Explorer](https://explorer.apothem.network/address/0x74996f530fe88776d2ecef1fe301e523c55b61e5) |
| SkillSwapMain | 0x242f1c5ad353cb06034265dcbe943f816a0ba756 | [View on Explorer](https://explorer.apothem.network/address/0x242f1c5ad353cb06034265dcbe943f816a0ba756) |

## Contract Details

Each contract is documented in detail in its own file:

- [MentorshipToken](./MentorshipToken.md)
- [MentorRegistry](./MentorRegistry.md)
- [SessionManager](./SessionManager.md)
- [ReputationSystem](./ReputationSystem.md)
- [SkillSwapMain](./SkillSwapMain.md)

## Contract Interaction Flows

- [Mentor Registration and Profile Management](./flows/mentor-registration.md)
- [Session Booking Process](./flows/session-booking.md)
- [Payment Processing](./flows/payment-processing.md)
- [Rating and Reputation System](./flows/rating-system.md)

## For Developers

- [Contract Integration Guide](./integration-guide.md)
- [API Reference](./api-reference.md)
- [Testing Guide](./testing-guide.md)
- [Security Considerations](./security.md) 