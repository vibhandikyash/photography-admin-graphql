const { check, body } = require('express-validator');

const {
  models: {
    UserCollection: UserCollectionModel,
    UserCollectionAsset: UserCollectionAssetModel,
  }, Sequelize,
} = require('../../../sequelize-client');

const { Op } = Sequelize;

const create = [
  check('name')
    .notEmpty()
    .withMessage('asset url is required'),
  /* eslint-disable */
  // Validate asset url unique per user
  body('name').custom(async (value, { req }) => {
    const col = await UserCollectionModel.findOne({ where: { name:{[Op.iLike]: value}, userId: req.user.id}})
    if(col) return Promise.reject('asset url already used');
    return true;
  }),
  /* eslint-enable */
];

const update = [
  check('name')
    .notEmpty()
    .withMessage('asset url is required'),
  /* eslint-disable */
  // Validate asset url unique per user
  body('name').custom(async (value, { req }) => {
    // Check the asset url is same as requested name then skip
    const col = await UserCollectionModel.findOne({ where: {id: req.params.id, userId: req.user.id}})
    if (!col) return Promise.reject('COLLECTION_NOT_FOUND');
    if(col.name == value) return true;

    // Validate the asset url unique
    const cols = await UserCollectionModel.findOne({ where: { name:{[Op.iLike]: value}, userId: req.user.id}})
    if(cols) return Promise.reject('asset url already used');

    return true;
  }),
  /* eslint-enable */
];

const addCollectionFile = [
  check('files')
    .notEmpty()
    .withMessage('Files are required')
    .isArray()
    .withMessage('Invalid files value'),
];

const deleteCollectionFile = [
  check('files')
    .optional({ nullable: true })
    .isArray()
    .withMessage('Invalid files value'),
];

const addVideo = [
  check('title')
    .notEmpty()
    .withMessage('Video title is required'),
  check('url')
    .isURL()
    .withMessage('Invalid video URL')
    .notEmpty()
    .withMessage('Video url is required'),
  /* eslint-disable */
  // Validate asset url unique per user
  body('url').custom(async (value, { req }) => {
    // Validate the assets url  unique
    const assets = await UserCollectionAssetModel.findOne({ where: { url: { [Op.iLike]: value }, userId: req.user.id } });
    if (assets) return Promise.reject('URL_MUST_BE_UNIQUE');

    return true;
  }),
  // Validate asset title unique per user
  body('title').custom(async (value, { req }) => {
    // Validate the assets title  unique
    const collection = await UserCollectionModel.findOne({ where: { name: { [Op.iLike]: value }, userId: req.user.id } });
    const asset = await UserCollectionAssetModel.findOne({ where: { title: { [Op.iLike]: value }, userId: req.user.id } });
    if (asset || collection) return Promise.reject('TITLE_MUST_BE_UNIQUE');

    return true;
  }),
];

const updateVideo = [
  check('title')
    .notEmpty()
    .withMessage('Video title is required'),
  check('url')
    .isURL()
    .withMessage('Invalid video URL')
    .notEmpty()
    .withMessage('Video url is required'),
  /* eslint-disable */
  // Validate asset url unique per user
  body('url').custom(async (value, { req }) => {
    // Check the asset url is same as requested url then skip
    const asset = await UserCollectionAssetModel.findOne({ where: {collectionId: req.params.id, userId: req.user.id}})
    if (!asset) return Promise.reject('VIDEO_NOT_FOUND');
    if(asset.url == value) return true;

    // Validate the assets url  unique
    const assets = await UserCollectionAssetModel.findOne({ where: { url:{[Op.iLike]: value}, userId: req.user.id}})
    if(assets) return Promise.reject('URL_MUST_BE_UNIQUE');

    return true;
  }),
   // Validate asset title unique per user
   body('title').custom(async (value, { req }) => {
    // Validate the assets title  unique
    const collection = await UserCollectionModel.findOne({ where: { name: { [Op.iLike]: value }, userId: req.user.id } });
    const asset = await UserCollectionAssetModel.findOne({ where: { title: { [Op.iLike]: value }, userId: req.user.id } });
    if (asset || collection) return Promise.reject('TITLE_MUST_BE_UNIQUE');

    return true;
  }),
];

module.exports = {
  createCollectionValidator: create,
  updateCollectionValidator: update,
  addCollectionFileValidator: addCollectionFile,
  addCollectionVideoValidator: addVideo,
  deleteCollectionFileValidator: deleteCollectionFile, // add assets & delete assets request contain same parameters
  updateVideoValidator: updateVideo, // add assets & delete assets request contain same parameters
};
