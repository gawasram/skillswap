# SkillSwap Backend

Backend server for the SkillSwap platform, providing API services for user management, session scheduling, and WebRTC signaling.

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/skillswap.git
cd skillswap/backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration details.

4. Start the development server:

```bash
npm run dev
```

### Available Scripts

- `npm start`: Start the server in production mode
- `npm run dev`: Start the server with nodemon for development
- `npm run dev-simple`: Start a simplified dev server
- `npm run start:prod`: Start in production mode with production env variables
- `npm run migrate`: Run database migrations
- `npm run create-migration -- "migration name"`: Create a new migration file
- `npm run backup`: Perform a manual database backup

## Environment Configuration

The application uses different environment configurations:

- `.env.development` - Development environment settings
- `.env.test` - Test environment settings
- `.env.production` - Production environment settings
- `.env` - Default settings (falls back if environment-specific file not found)

## Project Structure

```
backend/
├── config/                  # Configuration modules
│   ├── database.js          # Database connection and settings
│   ├── env.js               # Environment variable loader
│   ├── logger.js            # Logging configuration
│   └── secrets.js           # Secrets management
├── migrations/              # Database migration files
├── models/                  # Mongoose models
│   ├── session.js
│   └── ...
├── routes/                  # API routes
│   ├── auth.js
│   ├── users.js
│   └── ...
├── scripts/                 # Utility scripts
│   ├── backup-database.js
│   ├── create-migration.js
│   └── run-migrations.js
├── services/                # Business logic services
│   ├── database/            # Database-related services
│   │   ├── backup.js        # Database backup service
│   │   └── migration.js     # Migration service
│   └── webrtc/              # WebRTC services
├── logs/                    # Application logs
├── .env.example             # Example environment variables
├── .env.production          # Production environment variables
├── DEPLOYMENT.md            # Deployment guide
├── server.js                # Main application entry point
└── package.json             # Project dependencies
```

## Database Management

### Migrations

Database migrations allow you to evolve your database schema over time:

```bash
# Create a new migration
npm run create-migration -- "add user roles"

# Run pending migrations
npm run migrate
```

### Backups

The system is configured with automated database backups:

```bash
# Perform a manual backup
npm run backup
```

Backups are stored in the configured backup directory and are automatically rotated based on retention settings.

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Security

- All API endpoints use JWT authentication
- Encryption for sensitive data
- Environment variable validation
- Secrets management for API keys

## License

This project is licensed under the MIT License - see the LICENSE file for details. 