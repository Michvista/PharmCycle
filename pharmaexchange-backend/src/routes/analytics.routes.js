const express = require('express');
const { getAnalytics } = require('../controllers/analytics.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', requireAuth, getAnalytics);

module.exports = router;
