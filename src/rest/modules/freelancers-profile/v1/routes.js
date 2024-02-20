const express = require('express');

const router = express.Router();

const {
  onboardValidator,
  updateProfileValidator,
  updateBusinessDetailsValidator,
  updateCoverPhotoValidator,
  // updateInstaLinkValidator,
} = require('../freelancers-profile.validator');

const createFreelancerEventIssue = require('./controllers/create-event-issue');

const getLead = require('./controllers/get-lead');
const getLeads = require('./controllers/get-leads');
const getProfile = require('./controllers/get-profile');
const onboardFreelancer = require('./controllers/onboard');
const updateBusinessDetails = require('./controllers/update-business-details');
const updateCoverPhoto = require('./controllers/update-cover-photo');
// const updateInstaLink = require('./controllers/update-insta-link');
const updateProfile = require('./controllers/update-profile');

const profileRouter = express.Router();

profileRouter.post('/onboard', onboardValidator, onboardFreelancer);
// router.post('/save-instagram', updateInstaLinkValidator, updateInstaLink);
profileRouter.get('/', getProfile);
profileRouter.post('/', updateProfileValidator, updateProfile);
profileRouter.post('/business-details', updateBusinessDetailsValidator, updateBusinessDetails);
profileRouter.post('/add-cover-photo', updateCoverPhotoValidator, updateCoverPhoto);
router.use('/profile', profileRouter);

router.post('/leads/issue', createFreelancerEventIssue);
router.get('/leads', getLeads);
router.get('/leads/:id', getLead);

module.exports = router;
