const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getInsights, generateInsight } = require('../controllers/insights.controller');

router.use(requireAuth);

router.get('/', getInsights);
router.post('/generate', generateInsight);

module.exports = router;
