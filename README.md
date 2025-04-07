# SkillSwap Platform

A decentralized peer-to-peer skill sharing and mentorship marketplace built on XDC Network.

## Overview

SkillSwap connects skilled mentors with mentees looking to learn new skills through one-on-one sessions. All transactions are secured using blockchain technology on the XDC Network.

## Features

- Decentralized mentorship marketplace
- Secure payment system using ROXN tokens
- Reputation and ratings system
- Video session integration (coming soon)
- Mobile app support (coming soon)

## Project Structure

- **Smart Contracts**: [/src/contracts](/src/contracts)
- **Backend**: [/src/backend](/src/backend)
- **Frontend**: [/src/frontend](/src/frontend)
- **Mobile App**: [/src/mobile_app](/src/mobile_app)
- **Documentation**: [/docs](/docs)

## Documentation

- [Smart Contract Documentation](/docs/contracts)
- [API Documentation](/docs/api)
- [User Guide](/docs/user-guide)
- [Developer Guide](/docs/developer-guide)

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Hardhat
- MetaMask or other Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/Roxonn-FutureTech/skillswap.git
cd skillswap

# Install dependencies
npm install

# Compile smart contracts
cd src/contracts
npx hardhat compile
```

### Running the DApp Locally

```bash
# Start the backend
cd src/backend
npm start

# In a new terminal, start the frontend
cd src/frontend
npm start
```

## Deployed Contracts (XDC Apothem Testnet)

| Contract | Address |
|----------|---------|
| MentorshipToken | 0x3bc607852393dcc75a3fccf0deb1699001d32bbd |
| MentorRegistry | 0xcfa935f28fff8f33ee08d6fdeed91b66aff6236e |
| SessionManager | 0xa976da47324dbb47e5bea23e8a4f3a369b42fe88 |
| ReputationSystem | 0x74996f530fe88776d2ecef1fe301e523c55b61e5 |
| SkillSwapMain | 0x242f1c5ad353cb06034265dcbe943f816a0ba756 |

## Contributing

Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 