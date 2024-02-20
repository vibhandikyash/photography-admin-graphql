const express = require('express');

const router = express.Router();

const {
  updateProfileValidator,
} = require('../recruiters-profile.validator');

const getProfile = require('./controllers/get-profile');
const updateProfile = require('./controllers/update-profile');

router.get('/', getProfile);
router.post('/', updateProfileValidator, updateProfile);

module.exports = router;
