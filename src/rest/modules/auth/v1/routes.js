const express = require('express');

const { FREELANCER, RECRUITER } = require('../../../../constants/service-constants');

const { isAuthenticated, roleCheck } = require('../../../middlewares/auth');

const { registerValidator, loginValidator, otpValidator } = require('../auth.validator');

const deleteUserAccount = require('./controllers/delete-user-account');

const loginUser = require('./controllers/login');
const logoutUser = require('./controllers/logout');
const registerUser = require('./controllers/register');
const verifyOtp = require('./controllers/verify-otp');

const router = express.Router();

router.post('/register', registerValidator, registerUser);
router.post('/login', loginValidator, loginUser);
router.post('/verify-otp', otpValidator, verifyOtp);
router.post('/logout', isAuthenticated, logoutUser);
router.delete('/delete-account', isAuthenticated, roleCheck([FREELANCER, RECRUITER]), deleteUserAccount);

module.exports = router;
