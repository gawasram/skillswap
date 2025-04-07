const express = require('express');
const router = express.Router();

// Webhook routes
router.post('/payment', (req, res) => {
  // Placeholder for payment webhook
  res.json({ success: true, message: 'Payment webhook received' });
});

router.post('/blockchain', (req, res) => {
  // Placeholder for blockchain webhook
  res.json({ success: true, message: 'Blockchain webhook received' });
});

module.exports = router;
