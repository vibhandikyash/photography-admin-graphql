/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const defaultLogger = require('../logger');
const { generatePassword, randomString } = require('../utils/auth/generate-password');

const usersData = require('./data/users');

const createUsers = async models => {
  try {
    const { User: UserModel } = models;

    const createUser = async () => {
      try {
        const usersInstance = [];
        for (const user of usersData) {
          const count = await UserModel.count({
            where: { email: user.email },
          });
          if (!count) {
            usersInstance.push(user);
          }
          const userPassword = randomString(16);
          const hashedPassword = generatePassword(userPassword);
          user.password = hashedPassword;
          defaultLogger(`Password for ${user.email}: ${userPassword} `);
        }
        if (usersInstance.length) {
          await UserModel.bulkCreate(usersInstance);
        }
      } catch (error) {
        defaultLogger(`Error while creating bulk users ${error} `, null, 'error');
        throw error;
      }
    };

    setTimeout(async () => {
      await createUser();
    }, 10000);
  } catch (error) {
    defaultLogger(`Error while creating system users ${error} `, null, 'error');
  }
};

module.exports = createUsers;
