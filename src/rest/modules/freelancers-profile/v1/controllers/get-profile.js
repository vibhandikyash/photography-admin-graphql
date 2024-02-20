const defaultLogger = require('../../../../../logger');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const getUserWithRelationship = require('../../../../../utils/get-user-with-relationship');

const getProfile = async (req, res, next) => {
  try {
    const user = await getUserWithRelationship(req.user);

    return sendSuccessResponse(res, 'SUCCESS', 200, user);
  } catch (error) {
    defaultLogger(`Error while getting freelancer profile: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getProfile;
