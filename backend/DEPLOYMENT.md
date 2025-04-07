# SkillSwap Production Deployment Guide

This document provides instructions for setting up and deploying the SkillSwap backend in a production environment.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Access to your production server or cloud environment
- Domain name (optional, but recommended)
- MongoDB Database Tools (for backup/restore operations)

## 1. MongoDB Atlas Setup

### 1.1 Create a MongoDB Atlas Cluster

1. Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new project for SkillSwap
3. Deploy a new cluster (M0 free tier is sufficient for initial deployment)
4. Configure network access:
   - IP Access List: Add your server's IP address or use `0.0.0.0/0` (not recommended for high security)
   - VPC Peering (for AWS, GCP, or Azure deployments)

### 1.2 Create a Database User

1. In the Atlas dashboard, go to Database Access
2. Add a new database user with appropriate privileges
3. Use a strong, unique password
4. Note down the username and password

### 1.3 Configure Database Security

1. Enable database auditing
2. Set up IP allowlist to restrict access
3. Enable encryption at rest
4. Configure alerts for unusual activity

### 1.4 Get Connection String

1. In the Atlas dashboard, click "Connect" on your cluster
2. Select "Connect your application"
3. Copy the connection string (looks like `mongodb+srv://...`)
4. Replace `<username>` and `<password>` with your database user credentials

## 2. Environment Configuration

### 2.1 Set Up Environment Variables

1. Copy `.env.production` to `.env` on your production server
2. Update the following variables:
   - `MONGODB_URI_PROD`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Generate a strong random string
   - `ENCRYPTION_KEY`: Generate a 32-byte (64 hex character) key
   - Update other variables as needed

You can generate secure random values using:

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.2 Configure Backup Path

Ensure the backup path specified in `.env.production` exists and is writable:

```bash
mkdir -p /app/data/backups
chmod 755 /app/data/backups
```

## 3. Application Deployment

### 3.1 Deploy Code to Server

Clone the repository to your server:

```bash
git clone https://github.com/yourusername/skillswap.git
cd skillswap/backend
```

### 3.2 Install Dependencies

```bash
npm install --production
```

### 3.3 Run Database Migrations

```bash
npm run migrate
```

### 3.4 Start the Application

For production deployment, we recommend using a process manager like PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start server.js --name skillswap-backend --env production

# Ensure PM2 starts on server reboot
pm2 startup
pm2 save
```

## 4. Security Considerations

### 4.1 Firewall Configuration

Configure your server firewall to only allow necessary ports:

- Allow port 5000 (or your configured port) for API access
- Restrict SSH access to specific IP addresses

### 4.2 SSL/TLS Configuration

For production, always use HTTPS. You can set up Nginx as a reverse proxy with SSL:

```
server {
    listen 443 ssl;
    server_name api.yourskillswap.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3 Regular Security Updates

Keep your server and dependencies updated:

```bash
# Update Node.js packages
npm audit fix

# Update server
apt update && apt upgrade  # For Ubuntu/Debian
```

## 5. Backup and Recovery

### 5.1 Scheduled Backups

Backups are automatically scheduled based on your configuration. To manually trigger a backup:

```bash
npm run backup
```

### 5.2 Restore from Backup

To restore from a backup, you can use the MongoDB restore command:

```bash
mongorestore --uri="your_mongodb_uri" /path/to/backup/folder --drop
```

## 6. Monitoring and Logging

### 6.1 Log Management

Logs are stored in the `logs` directory by default. Consider setting up log rotation:

```bash
# Install logrotate if not already installed
apt install logrotate  # For Ubuntu/Debian

# Create a logrotate configuration
nano /etc/logrotate.d/skillswap
```

Add the following configuration:

```
/path/to/skillswap/backend/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 node node
    sharedscripts
    postrotate
        pm2 reload skillswap-backend
    endscript
}
```

### 6.2 Application Monitoring

Monitor your application using PM2:

```bash
pm2 monit
```

Consider setting up additional monitoring with tools like:
- Datadog
- New Relic
- MongoDB Atlas monitoring

## 7. Scaling Considerations

When your application needs to scale:

1. **Horizontal Scaling**: Deploy multiple instances behind a load balancer
2. **Database Scaling**: Upgrade your MongoDB Atlas tier
3. **Caching**: Implement Redis for caching and session management
4. **Content Delivery**: Use a CDN for static assets

## 8. Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check MongoDB Atlas connection string
   - Verify network access and IP allowlist
   - Check database user permissions

2. **Application Not Starting**:
   - Check logs in `logs/error.log`
   - Verify environment variables are correctly set
   - Ensure required ports are not blocked

3. **Backup Failures**:
   - Verify MongoDB Database Tools are installed
   - Check disk space available for backups
   - Ensure backup directory permissions are correct

## 9. Support

If you encounter any issues during deployment or need assistance, please contact the development team at support@skillswap.com.

---

**Note**: This deployment guide is a starting point. Adjust configurations based on your specific infrastructure and security requirements. 