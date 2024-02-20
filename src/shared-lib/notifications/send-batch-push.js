/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { ONE_SIGNAL } = require('../../config/config');
const defaultLogger = require('../../logger');

const sendPush = require('./send-push');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const sendBatchPush = async (receiverUsers = [], pushData = {}) => {
  try {
    // DO NOTHING IF NO RECEIVER USERS
    if (!receiverUsers.length) {
      return;
    }

    // SEND PUSH NOTIFICATION, IF ONLY ONE RECEIVER USER
    if (receiverUsers.length === 1) {
      const { userId } = receiverUsers[0];
      pushData.filters = [{
        field: 'tag',
        key: 'userId',
        relation: '=',
        value: userId,
      }];
      sendPush(pushData);
      return;
    }

    // CREATE FILTER BATCHES OF RECEIVER USERS, AND SEND PUSH NOTIFICATION
    let filters = [];
    let count = 0;
    for (const user of receiverUsers) {
      count += 1;
      // IF FILTER REACHED MAX, PUSH TO FILTER AND SEND PUSH, CLEAR FILTER
      if (filters.length === 198 || count === receiverUsers.length) {
        filters.splice(0, 1);
        filters.push({ operator: 'OR' });
        filters.push({
          field: 'tag',
          key: 'userId',
          relation: '=',
          value: user.userId,
        });
        pushData.filters = filters;
        await sleep(ONE_SIGNAL.BATCH_REQUEST_WAIT_TIME_IN_MS);
        sendPush(pushData);
        filters = [];
      } else {
        // ELSE PUSH TO FILTER ARRAY
        filters.push({ operator: 'OR' });
        filters.push({
          field: 'tag',
          key: 'userId',
          relation: '=',
          value: user.userId,
        });
      }
    }
  } catch (err) {
    defaultLogger(`Error in sendBatchPush: ${err}`, null, 'error');
  }
};

module.exports = sendBatchPush;
