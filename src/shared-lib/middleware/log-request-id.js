const { v4: uuid } = require('uuid');

const requestIdMiddleware = async (resolve, root, args, context, info) => {
  const requestId = uuid();
  context.requestId = requestId;
  const result = await resolve(root, args, context, info);
  return result;
};

module.exports = requestIdMiddleware;
