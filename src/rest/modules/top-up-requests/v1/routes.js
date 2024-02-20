const express = require('express');

const { RECRUITER, FREELANCER } = require('../../../../constants/service-constants');

const { roleCheck } = require('../../../middlewares/auth');
const { topUpRequestsValidator, topUpRequestsApprovalValidator } = require('../top-up-requests.validator');

const topUpRequests = require('./controllers/create-top-up-requests');

const topUpRequestsApproval = require('./controllers/top-up-requests-approval');

const router = express.Router();

router.post('/', roleCheck([RECRUITER]), topUpRequestsValidator, topUpRequests);
router.patch('/:id/approval', roleCheck([FREELANCER]), topUpRequestsApprovalValidator, topUpRequestsApproval);

module.exports = router;
