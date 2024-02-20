const express = require('express');
const rateLimit = require('express-rate-limit');

const config = require('../config/config');
const { getMessage } = require('../utils/messages');

const router = express.Router();
const { restErrorHandler } = require('./middlewares/error-handler');
const aadhaarRoutes = require('./modules/aadhaar');
const authRoutes = require('./modules/auth');
const chatRoutes = require('./modules/chats');
const commonRoutes = require('./modules/common');
const eventsRoute = require('./modules/events');
const freelancersRoute = require('./modules/freelancers');
const freelancerProfileRoutes = require('./modules/freelancers-profile');
const notificationsRoutes = require('./modules/notifications');
const portfolioCollectionsRoutes = require('./modules/portfolio-collections');
const recruitersRoute = require('./modules/recruiters');
const recruiterProfileRoutes = require('./modules/recruiters-profile');
const regularizationRoutes = require('./modules/regularizations');
const topUpRequestsRoutes = require('./modules/top-up-requests');
const { TOO_MANY_REQ } = require('./services/http-status-codes');

// TODO: remove this to per request routes
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 60, // Limit each IP to 'REST_API_LIMIT' requests per `window` (e.g, per 1 minutes 60request)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler(req, res) {
    res.status(TOO_MANY_REQ).json({
      status: TOO_MANY_REQ,
      message: getMessage('RATE_LIMIT'),
    });
  },
  keyGenerator: req => {
    const { baseUrl, method } = req;
    const ip = req.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req.ip || 'NA';
    const key = `${method}_${baseUrl}_${ip}`;
    return key;
  },
});

// Apply the rate limiting middleware to all requests
if (!config.BYPASS_RATE_LIMIT) router.use(limiter);

router.use(authRoutes);
router.use(portfolioCollectionsRoutes);
router.use(freelancerProfileRoutes);
router.use(recruiterProfileRoutes);
router.use(aadhaarRoutes);
router.use(freelancersRoute);
router.use(eventsRoute);
router.use(recruitersRoute);
router.use(commonRoutes);
router.use(regularizationRoutes);
router.use(chatRoutes);
router.use(topUpRequestsRoutes);
router.use(notificationsRoutes);
router.use(restErrorHandler);

module.exports = router;
