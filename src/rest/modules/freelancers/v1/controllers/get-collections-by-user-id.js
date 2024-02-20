const { sendSuccessResponse } = require('../../../../../utils/create-error');
const getActiveFreelancer = require('../../../../services/get-active-freelancer');
const freelancersLogger = require('../../freelancers-logger');

const getCollectionsByUserId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const freelancer = await getActiveFreelancer(id);

    return sendSuccessResponse(res, 'SUCCESS', 200, freelancer);
  } catch (error) {
    freelancersLogger(`Error from get-featured-profiles: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getCollectionsByUserId;
