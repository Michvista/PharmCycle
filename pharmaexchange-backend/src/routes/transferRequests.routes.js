const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getTransferRequests, updateTransferRequest, getTransferRequestSummary } = require('../controllers/transferRequests.controller');

router.use(requireAuth);

router.get('/summary', getTransferRequestSummary);
router.get('/', getTransferRequests);
router.patch('/:id', updateTransferRequest);

module.exports = router;
