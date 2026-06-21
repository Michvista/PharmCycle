const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getSummary, getInventoryStatusBreakdown } = require('../controllers/dashboard.controller');

router.use(requireAuth);

router.get('/summary', getSummary);
router.get('/inventory-status', getInventoryStatusBreakdown);

module.exports = router;
