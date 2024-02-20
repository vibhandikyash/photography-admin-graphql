/* eslint-disable camelcase */
const { default: axios } = require('axios');
const { isEmpty } = require('lodash');

const { ONE_SIGNAL } = require('../../config/config');
const defaultLogger = require('../../logger');

const sendPush = async data => {
  try {
    const pushData = {};
    pushData.app_id = ONE_SIGNAL.APP_ID;

    if (data.title != null) {
      pushData.headings = { en: data.title };
    }

    if (data.content != null) {
      pushData.contents = { en: data.content };
    }

    if (!isEmpty(data.additionalData)) {
      pushData.data = data.additionalData;
    }

    if (!isEmpty(data.filters)) {
      pushData.filters = data.filters;
    }

    pushData.ios_badgeType = 'Increase';
    pushData.ios_badgeCount = 1;

    const res = await axios.post(ONE_SIGNAL.URL, pushData, {
      headers: {
        Authorization: `Basic ${ONE_SIGNAL.API_KEY}`,
        'content-type': 'application/json',
      },
    });

    defaultLogger(`PUSH_NOTIFICATION_SENT : response => ${JSON.stringify(res.data)}`, null, 'info');
  } catch (err) {
    defaultLogger(`Error from sendPush: ${err}`, null, 'error');
  }
};

module.exports = sendPush;
