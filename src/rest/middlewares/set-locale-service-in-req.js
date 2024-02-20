const { get } = require('lodash');

const { ENGLISH, ACCEPT_LANGUAGES } = require('../../constants/language-constants');

const setLocaleServiceInReq = localeService => (req, res, next) => {
  if (localeService) {
    let acceptLanguage = get(req, 'headers.accept-language', ENGLISH);
    if (!ACCEPT_LANGUAGES.includes(acceptLanguage)) {
      acceptLanguage = ENGLISH;
    }
    localeService.setLocale(acceptLanguage);
    req.localeService = localeService;
  }
  next();
};

module.exports = setLocaleServiceInReq;
