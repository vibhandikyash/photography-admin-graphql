/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const defaultLogger = require('../logger');

const userTypeObj = require('./data/user-type');

const createUserType = async models => {
  try {
    const { UserType: UserTypeModel } = models;

    const userType = async () => {
      try {
        const userTypeData = [];
        for (const typeObj of userTypeObj) {
          const count = await UserTypeModel.count({
            where: { key: typeObj.key },
          });
          if (!count) {
            userTypeData.push(typeObj);
          }
        }
        if (userTypeData.length) {
          await UserTypeModel.bulkCreate(userTypeData);
        }
      } catch (error) {
        defaultLogger(`Error while bulk create user type > ${error}`, null, 'error');
        throw error;
      }
    };

    setTimeout(async () => {
      await userType();
    }, 10000);
  } catch (error) {
    defaultLogger(`Error while creating freelancer user type ${error}`, null, 'error');
  }
};

module.exports = createUserType;
