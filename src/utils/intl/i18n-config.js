const path = require('path');

const i18n = require('i18n');

const { ACCEPT_LANGUAGES, ENGLISH } = require('../../constants/language-constants');

i18n.configure({
  locales: ACCEPT_LANGUAGES,
  defaultLocale: ENGLISH,
  queryParameter: 'lang',
  directory: path.join('./src/utils/intl', 'locales'),
  api: {
    __: 'translate',
    __n: 'translateN',
  },
});

module.exports = i18n;
