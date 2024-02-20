const defaultLogger = require('../../../../../logger');
const { models: { User: UserModel, UserProfile: UserProfileModel }, Sequelize } = require('../../../../../sequelize-client');

const userFindOneByPhone = async contactNo => {
  try {
    const { Op } = Sequelize;

    const user = await UserModel.findOne({
      where: {
        accountDeletedAt: null,
        [Op.or]: [
          { contactNo: { [Op.iLike]: `${contactNo}` } },
          Sequelize.where(
            Sequelize.cast(Sequelize.col('User.id'), 'varchar'),
            { [Op.iLike]: `${contactNo}` },
          ),
        ],
      },
      include: [
        {
          model: UserProfileModel,
          as: 'profile',
          attributes: ['typeKey', 'isFeatured'],
        },
      ],
      attributes: ['id', 'fullName', 'userName', 'email', 'emailVerified', 'verificationStatus', 'contactNo',
        'countryCode', 'role', 'isActive', 'otp', 'otpRequestAttempts', 'otpWrongAttempts', 'otpExpiry'],
    });

    if (!user) {
      return false;
    }
    user.isFeatured = user?.profile?.isFeatured;

    return user;
  } catch (error) {
    defaultLogger(`Error while finding user by phone: ${error.message}`, null, 'error');
    return false;
  }
};

const extractToken = async req => {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  } if (req.query && req.query.token) {
    return req.query.token;
  }
  return false;
};

module.exports = { userFindOneByPhone, extractToken };
