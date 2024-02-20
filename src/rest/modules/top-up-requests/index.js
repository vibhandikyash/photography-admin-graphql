const express = require('express');

const { isAuthenticated } = require('../../middlewares/auth');

const router = express.Router();
const v1Routes = require('./v1/routes');

router.use('/v1/top-up-requests', isAuthenticated, v1Routes);

module.exports = router;
