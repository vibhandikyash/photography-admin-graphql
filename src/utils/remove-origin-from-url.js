/* eslint-disable consistent-return */
const { URL_REGEX } = require('../constants/regex-constants');
const defaultLogger = require('../logger');

const removeOriginFromUrl = key => {
  try {
    let filterKey;
    if (key) {
      if (key.match(URL_REGEX)) {
        const urlObj = new URL(key);
        if (urlObj.origin) {
          filterKey = urlObj.href.replace(urlObj.origin, '');
          if (urlObj.search) {
            filterKey = filterKey.replace(urlObj.search, '');
          }
          filterKey = filterKey.replace(/^\//, '');
          return filterKey;
        }
      }
      return key.replace(/\/$/, '');
    }
  } catch (error) {
    defaultLogger(`Error while removing base url from url ${error}`, null, 'error');
  }
};

module.exports = removeOriginFromUrl;
