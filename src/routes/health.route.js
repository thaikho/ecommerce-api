const router = require('express').Router();
const prisma = require('../config/prisma');

router.get('/', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            status: 'ok',
            db: 'connected',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        res.status(503).json({
            status: 'error',
            db: 'disconnected',
            error: err.message,
        });
    }
});

module.exports = router;