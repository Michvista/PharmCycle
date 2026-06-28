const express = require('express');
const router = express.Router();
const { registerConsumer, loginConsumer, requestPasswordReset, resetPassword } = require('../controllers/consumerAuth.controller');
const { searchMedicine, getMedicineAvailability } = require('../controllers/consumerSearch.controller');

router.post('/auth/register', registerConsumer);
router.post('/auth/login', loginConsumer);
router.post('/auth/forgot-password', requestPasswordReset);
router.post('/auth/reset-password', resetPassword);

// Search is intentionally public (no auth) - a patient looking for medicine
// shouldn't need an account just to check availability. Consumer auth is only
// needed for actions like saving favorites / requesting reservations later.
router.get('/search', searchMedicine);
router.get('/medicines/:id/availability', getMedicineAvailability);

module.exports = router;
