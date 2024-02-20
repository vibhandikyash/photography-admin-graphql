const express = require('express');

const { regularizeRequestValidator } = require('../regularizations.validator');

const regularizeRequest = require('./controllers/create-regularize-requests');

const router = express.Router();

router.post('/:id/regularize-requests', regularizeRequestValidator, regularizeRequest);

module.exports = router;
