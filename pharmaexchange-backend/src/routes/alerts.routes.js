const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getAlerts, markAlertRead } = require('../controllers/alerts.controller');

router.use(requireAuth);

router.get('/', getAlerts);
router.patch('/:id/read', markAlertRead);

module.exports = router;
