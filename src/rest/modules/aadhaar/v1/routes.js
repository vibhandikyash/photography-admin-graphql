const express = require('express');

const router = express.Router();

const {
  updateAadhaarValidation,
} = require('../aadhaar.validator');

const getProfile = require('./controllers/get-aadhaar');
const updateAadhaar = require('./controllers/update-aadhaar');

router.get('/', getProfile);
router.post('/', updateAadhaarValidation, updateAadhaar);

module.exports = router;
