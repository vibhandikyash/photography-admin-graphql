const express = require('express');

const { FREELANCER } = require('../../../constants/service-constants');

const { roleCheck, isAuthenticated } = require('../../middlewares/auth');

const router = express.Router();
const v1Routes = require('./v1/routes');

router.use('/v1/freelancer', isAuthenticated, roleCheck([FREELANCER]), v1Routes);

module.exports = router;
