const crypto = require('crypto');

const { SALT } = require('../../config/config');
const defaultLogger = require('../../logger');

const generatePassword = passwordString => {
  try {
    // TODO: CREATE VERIFY PASSWORD FUNCTION BASED ON REQUIREMENT, TO STORE SALT IN DATABASE OR NOT
    // HASHING USER'S SALT AND PASSWORD WITH 1000 ITERATIONS
    const hash = crypto.pbkdf2Sync(passwordString, SALT, 1000, 64, 'sha512').toString('hex');
    return hash;
  } catch (error) {
    defaultLogger(`Error from generatePassword => ${error}`, {}, 'error');
    throw error;
  }
};

const randomString = (length = 5) => {
  try {
    let result = '';
    result = crypto.randomBytes(parseInt(length, 10)).toString('hex');
    return result;
  } catch (error) {
    defaultLogger(`Error from randomString => ${error}`, {}, 'error');
    throw error;
  }
};

module.exports = { generatePassword, randomString };
