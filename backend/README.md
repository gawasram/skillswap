# SkillSwap API

The SkillSwap API is a RESTful API built with FastAPI that powers the SkillSwap platform.

## Features

- **User Authentication**: Secure login and registration with JWT tokens
- **Role-Based Access Control**: Fine-grained permissions management
- **Two-Factor Authentication**: Enhanced security with TOTP
- **MongoDB Integration**: High-performance database with connection pooling
- **Redis Integration**: Caching and rate limiting capabilities
- **Automatic Swagger Documentation**: Interactive API documentation
- **Asynchronous Processing**: Utilizing Python's async capabilities
- **Database Backups**: Automated backups with retention policies
- **Database Migrations**: Track and manage schema changes
- **Error Tracking**: Sentry integration for tracking and alerting
- **Structured Logging**: JSON-formatted logs for easier analysis
- **Rate Limiting**: Protect API from abuse
- **Health Monitoring**: Scheduled checks and alerts
- **Encryption Utilities**: For securing sensitive data
- **Blockchain Integration**: XDC Network connectivity for smart contract interaction

## Requirements

- Python 3.9+
- MongoDB 4.4+
- Redis 6.0+
- Poetry (optional, for dependency management)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/skillswap.git
   cd skillswap/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   - Copy `.env.development` to `.env` and edit as needed
   - For production, use `.env.production`

## Running the Application

Development mode:
```bash
uvicorn main:app --reload --port 5005
```

Production mode:
```bash
uvicorn main:app --host 0.0.0.0 --port 5005 --workers 4
```

## API Documentation

The API documentation is available at:
- Swagger UI: `/api/docs`
- ReDoc: `/api/redoc`
- OpenAPI JSON: `/api/openapi.json` (used for frontend client generation)

## API Endpoints

The API provides the following key endpoints:

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (invalidate tokens)

### Users
- `GET /api/users` - List all users
- `GET /api/users/{user_id}` - Get user details
- `PUT /api/users/{user_id}` - Update user details
- `DELETE /api/users/{user_id}` - Delete user

### Sessions
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create a new session
- `GET /api/sessions/{session_id}` - Get session details
- `PUT /api/sessions/{session_id}` - Update session
- `POST /api/sessions/{session_id}/start` - Start session
- `POST /api/sessions/{session_id}/end` - End session

### Blockchain Integration
- `POST /api/blockchain/transactions` - Submit transaction
- `GET /api/blockchain/transactions/{tx_hash}` - Get transaction status
- `GET /api/blockchain/balance` - Get wallet balance

### Admin
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/logs` - View system logs
- `POST /api/admin/backup` - Trigger database backup
- `GET /api/admin/health` - System health check

## Database Migrations

Run migrations:
```bash
python skillswap_cli.py migrations --run
```

Create a new migration:
```bash
python skillswap_cli.py migrations --create migration_name --description "Description"
```

Rollback migrations:
```bash
python skillswap_cli.py migrations --rollback --count 1
```

## Database Backups

Create a backup:
```bash
python skillswap_cli.py backup --create
```

List available backups:
```bash
python skillswap_cli.py backup --list
```

Restore from backup:
```bash
python skillswap_cli.py backup --restore backup_filename.tar.gz
```

Clean up old backups:
```bash
python skillswap_cli.py backup --cleanup
```

## Project Structure

```
backend/
├── app/
│   ├── api/               # API routes and controllers
│   ├── cli/               # Command-line interface tools
│   ├── config/            # Configuration files
│   ├── core/              # Core functionality and middleware
│   ├── db/                # Database models and handlers
│   │   ├── migrations/    # Database migrations
│   │   └── repositories/  # Data access layer
│   ├── models/            # Pydantic models for API
│   ├── services/          # Business logic layer
│   └── utils/             # Utility functions
│       ├── auth/          # Authentication utilities
│       ├── blockchain/    # Blockchain interactions
│       └── logging/       # Logging utilities
├── logs/                  # Log files
├── backups/               # Database backups
├── main.py                # Application entry point
├── requirements.txt       # Dependencies
└── skillswap_cli.py       # CLI entry point
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To authenticate:

1. Register a new user at `/api/auth/register`
2. Login at `/api/auth/login` to receive access and refresh tokens
3. Include the access token in the Authorization header: `Authorization: Bearer <token>`
4. Use the refresh token to get a new access token when it expires

## Frontend Integration

The API provides an OpenAPI specification that can be used to generate a type-safe client for the frontend:

```bash
# From the frontend directory
npm run generate-api
```

See `/frontend/API-INTEGRATION.md` for detailed integration instructions.

## Monitoring and Logging

- **Logging**: Structured JSON logs in `logs/` directory
- **Error Tracking**: Integration with Sentry for error monitoring
- **Performance**: Request timing middleware for performance analysis
- **Health Checks**: Scheduled health checks with alerts

## Deployment

See `DEPLOYMENT.md` for production deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 