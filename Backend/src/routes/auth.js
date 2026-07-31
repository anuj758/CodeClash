const express = require('express');
const {login, logout, isUserNameAvailable, verifyEmail, userRegister, checkAuth, resendVerificationLink, checkVerificationStatus} = require('../controllers/auth');
const verifyJWT = require('../middleware/verifyJWT');

const authRouter = express.Router();

authRouter.post('/register', userRegister);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
authRouter.post('/verify-email', verifyEmail);
authRouter.post('/resend-link', resendVerificationLink);
authRouter.post('/check-username/:username', isUserNameAvailable);
authRouter.get('/check', verifyJWT, checkAuth)
authRouter.post('/verification-status', checkVerificationStatus)


module.exports = authRouter;