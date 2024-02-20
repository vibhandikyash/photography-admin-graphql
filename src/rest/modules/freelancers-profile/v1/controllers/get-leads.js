const { QUERY_PAGING_MAX_COUNT, QUERY_PAGING_MIN_COUNT } = require('../../../../../config/config');
const defaultLogger = require('../../../../../logger');
const { sendSuccessResponse } = require('../../../../../utils/create-error');
const getFreelancerLeadsService = require('../../../../services/get-freelancer-leads');

const getLeads = async (req, res, next) => {
  try {
    let { query: { limit = QUERY_PAGING_MIN_COUNT } } = req;
    const { skip: offset, status } = req.query;
    limit = parseInt(limit > QUERY_PAGING_MAX_COUNT ? QUERY_PAGING_MAX_COUNT : limit, 10);

    const response = await getFreelancerLeadsService(req.user.id, limit, offset, status);
    return sendSuccessResponse(res, 'SUCCESS', 200, response);
  } catch (error) {
    defaultLogger(`Error while getting freelancer leads: ${error.message}`, null, 'error');
    return next(error);
  }
};

module.exports = getLeads;
