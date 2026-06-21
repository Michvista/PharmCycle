const express = require('express');
const { getProfile, updateProfile } = require('../controllers/pharmacy.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', requireAuth, getProfile);
router.patch('/profile', requireAuth, updateProfile);

module.exports = router;
