
const express = require('express');

const { isAuthenticated } = require('../../../middlewares/auth');

const awsFileUpload = require('./controllers/aws-file-upload-url');
const awsFilesUpload = require('./controllers/aws-files-upload-urls');
const getReviews = require('./controllers/get-reviews');
const getTopCities = require('./controllers/get-top-cities');
const searchCountries = require('./controllers/search-countries');

const router = express.Router();
router.get('/reviews/:id', getReviews);
router.get('/top-cities', getTopCities);
router.post('/countries', searchCountries);
router.post('/get-signed-url', isAuthenticated, awsFileUpload);
router.post('/get-signed-urls', isAuthenticated, awsFilesUpload);

module.exports = router;
