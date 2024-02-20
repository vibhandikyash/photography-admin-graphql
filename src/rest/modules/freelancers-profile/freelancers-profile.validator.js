const { check, body } = require('express-validator');

const freelancerCategoryConstants = require('../../../constants/freelancer-category-constants');

const { models: { User: UserModel }, Sequelize } = require('../../../sequelize-client');

const { Op } = Sequelize;

const onboard = [
  check('fullName')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 4 })
    .withMessage('Name must be at least 4 characters long'),
  check('pricePerDay')
    .notEmpty()
    .withMessage('Price per day is required')
    .isDecimal()
    .withMessage('Invalid per day price'),
  /* eslint-disable */
  body('userName').custom(async (value, { req }) => {
    if (value !== req.user.userName) {
      await UserModel.findOne({ where: { userName: {[Op.iLike]: value}, accountDeletedAt: null } }).then(user => {
        if (user) {
          return Promise.reject('Username already taken');
        }
      });
    }
    return true;
  }),
  /* eslint-enable */
  check('category')
    .notEmpty()
    .withMessage('Category field required')
    .isIn(freelancerCategoryConstants)
    .withMessage('Invalid category'),
  check('primaryLocation')
    .notEmpty()
    .withMessage('Primary location is required')
    .isLength({ min: 2 })
    .withMessage('Primary location is required'),
];

const updateProfile = [
  check('fullName')
    .notEmpty()
    .withMessage('Name is required'),
  check('userName')
    .notEmpty()
    .withMessage('Username is required'),
  /* eslint-disable */
  body('userName').custom(async (value, { req }) => {
    if (value !== req.user.userName) {
      await UserModel.findOne({ where: { userName: value, accountDeletedAt: null } }).then(user => {
        if (user) {
          return Promise.reject('Username is already taken');
        }
      });
    }
    return true;
  }),
  /* eslint-enable */
  check('category')
    .notEmpty()
    .withMessage('Category field is required')
    .isIn(freelancerCategoryConstants)
    .withMessage('Invalid category'),
  check('primaryLocation')
    .notEmpty()
    .withMessage('Primary location is required'),
  check('secondaryLocation')
    .optional({ nullable: true, checkFalsy: true })
    .notEmpty()
    .withMessage('Secondary location is required'),
  check('pricePerDay')
    .notEmpty()
    .withMessage('Price per day is required')
    // .optional({ nullable: true, checkFalsy: true })
    .isDecimal()
    .withMessage('Invalid per day price'),
];

const updateBusinessDetails = [
  // Commented for future support (by aziz)
  // check('tagLine')
  //  .notEmpty()
  //  .withMessage('Tagline is required'),
  // check('accomplishments')
  //  .notEmpty()
  //  .withMessage('Accomplishments is required'),
  // check('equipmentList')
  //  .notEmpty()
  //  .withMessage('Equipments list required'),
  check('instagramLink')
    .optional({ nullable: true, checkFalsy: true })
    .isURL()
    .withMessage('Invalid instagram link'),
];

const updateInstaLink = [
  check('instagramLink')
    .notEmpty()
    .withMessage('Instagram link is required')
    .isURL()
    .withMessage('Invalid link'),
];

const updateCoverPhoto = [
  check('coverPhoto')
    .notEmpty()
    .withMessage('Cover photo is required'),
];

module.exports = {
  onboardValidator: onboard,
  updateProfileValidator: updateProfile,
  updateBusinessDetailsValidator: updateBusinessDetails,
  updateInstaLinkValidator: updateInstaLink,
  updateCoverPhotoValidator: updateCoverPhoto,
};
