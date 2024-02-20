const express = require('express');

const { FREELANCER } = require('../../../../constants/service-constants');

const { isAuthenticated, roleCheck } = require('../../../middlewares/auth');
const { otpVerificationValidator, eventClockOutValidator, listFreelancersValidator } = require('../freelancers.validator');

const eventClockOut = require('./controllers/event-clock-out');
const eventOtpVerification = require('./controllers/event-otp-verification');
const freelancers = require('./controllers/freelancers');
const getProfileByID = require('./controllers/get-by-id');
const getCalenderDetails = require('./controllers/get-calender-details');

const getCategories = require('./controllers/get-categories');
const getDashboardEventList = require('./controllers/get-dashboard-event-list');
const getFreelancerFeaturedAssets = require('./controllers/get-featured-assets');
const getFeaturedProfiles = require('./controllers/get-featured-profiles');
const getFreelancerLeads = require('./controllers/get-leads');
const getPaymentDetails = require('./controllers/get-payment-details');
const getPaymentHistory = require('./controllers/get-payment-history');
const getTransactionDetails = require('./controllers/get-transaction-details');
const getFreelancersAllVideos = require('./controllers/get-videos');
const listFreelancers = require('./controllers/list-freelancers');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/featured-freelancers', getFeaturedProfiles);
router.get('/dashboard/events', isAuthenticated, roleCheck([FREELANCER]), getDashboardEventList);
router.get('/leads', isAuthenticated, roleCheck([FREELANCER]), getFreelancerLeads);
router.get('/featured-assets', getFreelancerFeaturedAssets);
router.get('/videos/:id', getFreelancersAllVideos);
router.get('/', listFreelancersValidator, listFreelancers); // sends detailed information (release-0.2.0)
router.get('/list', isAuthenticated, freelancers); // (release-0.3.0)

router.get('/transactions', isAuthenticated, roleCheck([FREELANCER]), getTransactionDetails);
router.get('/calender', isAuthenticated, roleCheck([FREELANCER]), getCalenderDetails);
router.get('/payments', isAuthenticated, roleCheck([FREELANCER]), getPaymentHistory);
router.get('/payments/:id', isAuthenticated, roleCheck([FREELANCER]), getPaymentDetails);
router.get('/:id', getProfileByID);
router.post('/otp-verification', isAuthenticated, roleCheck([FREELANCER]), otpVerificationValidator, eventOtpVerification);
router.post('/clock-out', isAuthenticated, roleCheck([FREELANCER]), eventClockOutValidator, eventClockOut);

module.exports = router;
