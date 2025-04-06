// Basic authentication middleware
const authenticate = (req, res, next) => {
  // For development purposes only
  // In a real app, you would verify the JWT token
  req.user = {
    _id: 'demo-user-id',
    name: 'Demo User',
    email: 'demo@example.com',
    walletAddress: '0x1234567890123456789012345678901234567890'
  };
  next();
};

module.exports = { authenticate }; 