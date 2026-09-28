const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');

// Gắn router health check vào tiền tố /health
router.use('/health', require('./health.route'));

// Domain routes
router.use('/auth', require('./auth.route'));
router.use('/products', require('./product.route'));
router.use('/orders', authenticate, require('./order.route'));

module.exports = router;