const express = require('express');

const cancelRecruiterEvent = require('./controllers/cancel-event');

const router = express.Router();
const eventRouter = express.Router();

const createRecruiterEventIssue = require('./controllers/create-event-issue');
const createRecruiterEventTiming = require('./controllers/create-event-timing');
const getDashboardEventList = require('./controllers/get-dashboard-event-list');
const getRecruiterEvent = require('./controllers/get-event');
const getRecruiterEvents = require('./controllers/get-events');
const getPaymentDetails = require('./controllers/get-payment-details');
const getPaymentHistory = require('./controllers/get-payment-history');
const getCalenderDetails = require('./controllers/get-recruiter-calender-details');
const getTransactionDetails = require('./controllers/get-transaction-details');

router.get('/dashboard/events', getDashboardEventList);
router.get('/calender', getCalenderDetails);
router.get('/transactions', getTransactionDetails);
router.get('/payments/history', getPaymentHistory);
router.get('/payments/:id', getPaymentDetails);
router.use('/events', eventRouter);
eventRouter.get('/', getRecruiterEvents);
eventRouter.get('/:id', getRecruiterEvent);
eventRouter.post('/create-timing', createRecruiterEventTiming);
eventRouter.post('/cancel', cancelRecruiterEvent);
eventRouter.post('/issue', createRecruiterEventIssue);

module.exports = router;
