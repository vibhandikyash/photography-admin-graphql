const CONFIG = require('../config/config');
const defaultLogger = require('../logger');

const queryLengthMiddleware = (req, res, next) => {
  const query = req.query.query || req.body.query || '';
  const { QUERY_LENGTH_LIMIT } = CONFIG;
  if (query.length > QUERY_LENGTH_LIMIT) {
    defaultLogger(`QUERY LENGTH EXCEEDED ${QUERY_LENGTH_LIMIT} => ${query}`);
    res.status(400).send({ errors: [{ message: 'INVALID REQUEST' }] });
  } else {
    next();
  }
};

module.exports = queryLengthMiddleware;
