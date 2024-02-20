const express = require('express');

const collectionRouter = express.Router();
const videosRouter = express.Router();
const routes = express.Router();

const {
  createCollectionValidator, updateCollectionValidator, addCollectionFileValidator,
  addCollectionVideoValidator, deleteCollectionFileValidator, updateVideoValidator,
} = require('../portfolio-collections.validator');

const addFiles = require('./controllers/add-files');
const addVideo = require('./controllers/add-video');
const createCollection = require('./controllers/create-collection');
const deleteCollection = require('./controllers/delete');
const deleteFiles = require('./controllers/delete-files');
const getAllCollections = require('./controllers/get-all');
const getFeaturedAssets = require('./controllers/get-featured-assets');
const getOneCollection = require('./controllers/get-one');
const getOneVideo = require('./controllers/get-video');
const getAllVideos = require('./controllers/get-videos');
const makeImageFeatured = require('./controllers/make-featured-image');
const updateCollection = require('./controllers/update');
const updateVideo = require('./controllers/update-video');

// rest APIs
collectionRouter.post('/', createCollectionValidator, createCollection);
collectionRouter.get('/', getAllCollections);
collectionRouter.get('/:id', getOneCollection);
collectionRouter.post('/:id', updateCollectionValidator, updateCollection);
collectionRouter.delete('/:id', deleteCollection);

collectionRouter.post('/:id/files', addCollectionFileValidator, addFiles);
// collectionRouter.post('/:id/video-link', addCollectionVideoValidator, addVideo);
collectionRouter.delete('/:id/files', deleteCollectionFileValidator, deleteFiles);
collectionRouter.post('/make-featured/:assetId', makeImageFeatured);
routes.use('/collections', collectionRouter);

videosRouter.post('/', addCollectionVideoValidator, addVideo);
videosRouter.get('/', getAllVideos);
videosRouter.post('/:id', updateVideoValidator, updateVideo);
videosRouter.get('/:id', getOneVideo);
videosRouter.delete('/:id', deleteCollection);
routes.use('/videos', videosRouter);

routes.get('/featured-assets', getFeaturedAssets);

module.exports = routes;
