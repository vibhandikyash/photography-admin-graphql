const { get } = require('lodash');

const { ACCEPT_LANGUAGES, ENGLISH } = require('../../constants/language-constants');
const defaultLogger = require('../../logger');

const addLocaleServiceToCtx = (ctx, localeService) => {
  try {
    let acceptLanguage = get(ctx, 'req.headers.accept-language', ENGLISH);
    if (!ACCEPT_LANGUAGES.includes(acceptLanguage)) {
      acceptLanguage = ENGLISH;
    }
    localeService.setLocale(acceptLanguage);
    ctx.localeService = localeService;
  } catch (err) {
    defaultLogger(`Error from addLocaleServiceToCtx => ${err}`, null, 'error');
  }
};

module.exports = addLocaleServiceToCtx;
