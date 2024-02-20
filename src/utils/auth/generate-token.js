const jwt = require('jsonwebtoken');

const CONFIG = require('../../config/config');

const JWT_SECRET = CONFIG.JWT.SECRET;
const JWT_LIFE_TIME = CONFIG.JWT.LIFE_TIME;

const generateToken = userId => new Promise((resolve, reject) => {
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_LIFE_TIME }, (error, token) => {
    if (error) {
      return reject(error);
    }
    resolve(token);
    return true;
  });
});

module.exports = generateToken;
