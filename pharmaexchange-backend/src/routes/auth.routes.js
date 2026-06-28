const express = require('express');
const router = express.Router();
const { register, login, getMe, requestPasswordReset, resetPassword } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/me', requireAuth, getMe);

module.exports = router;
