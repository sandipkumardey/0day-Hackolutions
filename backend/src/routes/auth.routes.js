const express = require('express');
const { 
    register, 
    login, 
    getMe, 
    forgotPassword,
    resetPassword,
    updateDetails,
    updatePassword,
    verifyEmail,
    resendVerification,
    logout 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.get('/verify-email/:verificationToken', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.put('/updatedetails', updateDetails);
router.put('/updatepassword', updatePassword);
router.get('/logout', logout);

module.exports = router;
