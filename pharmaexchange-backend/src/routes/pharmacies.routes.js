const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { listPharmacies, getNearbyPharmacies } = require('../controllers/pharmacies.controller');

// optionalAuth: works for logged-in pharmacy users (excludes their own pharmacy
// from results) AND anonymous consumers searching for nearby pharmacies.
router.get('/', optionalAuth, listPharmacies);
router.get('/nearby', optionalAuth, getNearbyPharmacies);

module.exports = router;
