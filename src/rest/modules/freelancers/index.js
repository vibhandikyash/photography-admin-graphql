const express = require('express');

const router = express.Router();

const routes = require('./v1/routes');

router.use('/v1/freelancers', routes);

module.exports = router;
