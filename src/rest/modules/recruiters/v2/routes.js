const express = require('express');

const getPaymentBreakDown = require('./controllers/get-payment-break-down');
const getPayments = require('./controllers/get-payments');
const getServices = require('./controllers/get-services');

const router = express.Router();

router.get('/payment-history/payments', getPayments);
router.get('/payment-history/services', getServices);
router.get('/payment-history/amount-break-down', getPaymentBreakDown);

module.exports = router;
