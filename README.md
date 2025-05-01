# SkillSwap Platform

A decentralized peer-to-peer skill sharing and mentorship marketplace built on XDC Network.

## Overview

SkillSwap connects skilled mentors with mentees looking to learn new skills through one-on-one sessions. All transactions are secured using blockchain technology on the XDC Network.

## Features

- Decentralized mentorship marketplace
- Secure payment system using ROXN tokens
- Reputation and ratings system
- FastAPI backend with comprehensive monitoring
- Next.js frontend with Web3 integration
- Type-safe API integration
- Video session integration (coming soon)
- Mobile app support (coming soon)

## Project Structure

- **Smart Contracts**: Blockchain-based contracts for secure transactions
- **Backend**: FastAPI with MongoDB for persistence and Redis for caching
- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Documentation**: Comprehensive documentation and setup guides

## Tech Stack

### Backend
- FastAPI for high-performance API endpoints
- MongoDB for flexible document storage
- Redis for caching and rate limiting
- JWT-based authentication
- Sentry for error tracking
- Structured JSON logging
- Database migrations and backup systems

### Frontend
- Next.js for server-side rendering and routing
- TypeScript for type safety
- Tailwind CSS with shadcn/ui components
- Web3 wallet integration with ethers.js
- OpenAPI-generated TypeScript client

## Documentation

- [Backend Documentation](/backend/README.md)
- [Frontend Web3 Guide](/frontend/README-web3.md)
- [API Integration Guide](/frontend/API-INTEGRATION.md)
- [Setup Instructions](/frontend/SETUP-INSTRUCTIONS.md)

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB 4.4+
- Redis
- MetaMask or other Web3 wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/skillswap.git
cd skillswap

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

### Running Locally

```bash
# Start the backend
cd backend
uvicorn main:app --reload --port 5005

# In a new terminal, start the frontend
cd frontend
npm run dev
```

## API Integration

The frontend connects to the backend using an OpenAPI-generated TypeScript client for type-safe API calls:

```bash
# Generate API client
cd frontend
npm run generate-api
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