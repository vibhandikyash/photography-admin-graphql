const express = require('express');

const { RECRUITER } = require('../../../constants/service-constants');

const { isAuthenticated, roleCheck } = require('../../middlewares/auth');

const router = express.Router();
const v1Routes = require('./v1/routes');
const v2Routes = require('./v2/routes');

router.use('/v1/recruiters', isAuthenticated, roleCheck([RECRUITER]), v1Routes);
router.use('/v2/recruiters', isAuthenticated, roleCheck([RECRUITER]), v2Routes);

module.exports = router;
