const express = require('express');

const { RECRUITER } = require('../../../constants/service-constants');

const { roleCheck, isAuthenticated } = require('../../middlewares/auth');

const router = express.Router();
const v1Routes = require('./v1/routes');

router.use('/v1/recruiter/profile', isAuthenticated, roleCheck([RECRUITER]), v1Routes);

module.exports = router;
