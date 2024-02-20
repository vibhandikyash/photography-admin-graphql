const jwt = require('jsonwebtoken');
const { get } = require('lodash');

const userIdMiddleware = async (resolve, root, args, context, info) => {
  const token = context.req.headers.authorization;
  let userId = 'UNAUTHENTICATED';
  if (token && token.startsWith('Bearer ')) {
    const authToken = token.slice(7, token.length);
    const decodedToken = jwt.decode(authToken);
    userId = get(decodedToken, 'sub');
  }
  context.userId = userId;
  const result = await resolve(root, args, context, info);
  return result;
};

module.exports = userIdMiddleware;
