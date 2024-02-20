const messages = require('./intl/locales/en.json');

const getMessage = (key, localeService, localeServiceReplacements = {}) => {
  if (messages[key]) {
    if (localeService) {
      return localeService.translate(key, localeServiceReplacements);
    }
    return messages[key];
  }
  return key;
};

module.exports = { getMessage };
