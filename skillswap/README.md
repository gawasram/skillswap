# SkillSwap 🤝

A decentralized skill-sharing and mentorship platform powered by blockchain technology.

## Overview

SkillSwap is an innovative platform that connects learners with mentors, facilitating knowledge exchange through tokenized mentorship sessions. Using blockchain technology, we ensure transparent, secure, and rewarding learning experiences for both mentors and mentees.

## Features

- 🔄 Smart contract-based skill matching
- 💎 Token-based mentorship sessions
- 📊 Reputation system for mentors
- 📝 Interactive learning paths
- 🎯 Skill verification system
- 📅 Automated scheduling
- 💬 Real-time video sessions
- 🏆 Achievement tracking

## Project Structure

```
skillswap/
├── src/
│   ├── frontend/          # React web application
│   ├── backend/          # Node.js/Express backend
│   ├── contracts/        # Solidity smart contracts
│   └── mobile_app/       # React Native mobile app
├── docs/                 # Documentation
├── tests/               # Test suites
└── package.json         # Project dependencies
```

## Technology Stack

### Frontend & Mobile
- React.js with TypeScript
- React Native for mobile
- TailwindCSS for styling
- Redux Toolkit for state management
- ethers.js for blockchain interaction

### Backend
- Node.js/Express
- MongoDB for main database
- Redis for caching
- JWT for authentication
- WebRTC for video sessions

### Blockchain
- Solidity for smart contracts
- Hardhat for development
- OpenZeppelin for contract standards
- IPFS for decentralized storage

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+
- Redis
- MetaMask wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Roxonn-FutureTech/skillswap.git
cd skillswap
```

2. Install dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd src/frontend
npm install
```

4. Install mobile app dependencies:
```bash
cd ../mobile_app
npm install
```

5. Set up environment variables:
```bash
cp .env.example .env
```

6. Start development servers:
```bash
# Backend
cd src/backend
npm run dev

# Frontend
cd ../frontend
npm start

# Mobile App
cd ../mobile_app
npm start

# Smart Contract Development
cd ../contracts
npx hardhat node
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- Website: [roxonn.com](https://roxonn.com)
- GitHub: [@Roxonn-FutureTech](https://github.com/Roxonn-FutureTech) 