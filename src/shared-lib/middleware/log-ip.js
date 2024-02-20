const logIpMiddleware = async (resolve, root, args, context, info) => {
  context.reqIp = context.req.headers['x-forwarded-for'] || context.req.socket.remoteAddress || context.req.ip || 'NA';
  const result = await resolve(root, args, context, info);
  return result;
};

module.exports = logIpMiddleware;
