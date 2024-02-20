const languages = {
  ENGLISH: 'en',
  SPANISH: 'es',
};

module.exports = {
  ...languages,
  ACCEPT_LANGUAGES: Object.values(languages),
};
