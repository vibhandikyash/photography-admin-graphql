const { sendSuccessResponse } = require('../../../../../utils/create-error');
const validateUUID = require('../../../../../utils/validate-uuid');
const { ApiError } = require('../../../../services/custom-api-error');
const getActiveFreelancer = require('../../../../services/get-active-freelancer');
const getFreelancerCollections = require('../../../../services/get-freelancer-collections');
const freelancersLogger = require('../../freelancers-logger');

const getProfileByID = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!validateUUID(id)) throw new ApiError('INVALID_INPUT', 406);

    const { collectionId } = req.query;

    let response;

    if (collectionId === '' || collectionId) {
      response = await getFreelancerCollections(id, collectionId);
      return sendSuccessResponse(res, 'SUCCESS', 200, response);
    }

    response = await getActiveFreelancer(id);

    return sendSuccessResponse(res, 'SUCCESS', 200, response);
  } catch (error) {
    freelancersLogger(`Error from freelancer - > get-by-id: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getProfileByID;
