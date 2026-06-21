const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getAvailableTransfers,
  createTransferListing,
  requestTransfer,
} = require('../controllers/transfers.controller');

router.use(requireAuth);

router.get('/available', getAvailableTransfers);
router.post('/', createTransferListing);
router.post('/:id/request', requestTransfer);

module.exports = router;
