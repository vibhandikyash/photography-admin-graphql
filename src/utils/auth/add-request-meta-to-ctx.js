const jwt = require('jsonwebtoken');
const { get } = require('lodash');
const { v4: uuid } = require('uuid');

const addRequestMetaToCtx = ctx => {
  const token = ctx.req.headers.authorization;
  let userId = 'UNAUTHENTICATED';
  if (token && token.startsWith('Bearer ')) {
    const authToken = token.slice(7, token.length);
    const decodedToken = jwt.decode(authToken);
    userId = get(decodedToken, 'userId');
  }
  ctx.userId = userId;
  ctx.clientName = ctx.req.headers['apollographql-client-name'] || 'UNKNOWN';
  ctx.reqIp = ctx.req.headers['x-forwarded-for'] || ctx.req.socket.remoteAddress || ctx.req.ip || 'NA';
  ctx.requestId = uuid();
};

module.exports = addRequestMetaToCtx;
