const express = require('express');

const { FREELANCER } = require('../../../constants/service-constants');

const { isAuthenticated, roleCheck } = require('../../middlewares/auth');

const router = express.Router();
const v1Routes = require('./v1/routes');

router.use('/v1/events', isAuthenticated, roleCheck([FREELANCER]), v1Routes);

module.exports = router;
