const express = require('express');

const { RECRUITER, FREELANCER } = require('../../../../constants/service-constants');

const { roleCheck } = require('../../../middlewares/auth');
const {
  upfrontEventValidator,
  organicEventValidator,
  freelancerRatingValidator,
  recruiterRatingValidator,
} = require('../events.validator');

const addCustomEvent = require('./controllers/add-custom-event');

const createFreelancerReviews = require('./controllers/create-freelancer-reviews');
const createOrganicEvent = require('./controllers/create-organic-event');
const createRecruiterReviews = require('./controllers/create-recruiter-review');
const createUpfrontEvent = require('./controllers/create-upfront-event');
const getEventChatGroup = require('./controllers/get-event-chat-group');
// const getEventDetails = require('./controllers/get-event-details');

const router = express.Router();
router.post('/organic', roleCheck([RECRUITER]), organicEventValidator, createOrganicEvent);
router.post('/add-custom-event', addCustomEvent);
router.post('/upfront', roleCheck([RECRUITER]), upfrontEventValidator, createUpfrontEvent);
// router.get('/:id', getEventDetails);
router.post('/freelancer-review', roleCheck([RECRUITER]), freelancerRatingValidator, createFreelancerReviews);
router.post('/recruiter-review', roleCheck([FREELANCER]), recruiterRatingValidator, createRecruiterReviews);
router.get('/:eventId/chat-groups', getEventChatGroup);

module.exports = router;
