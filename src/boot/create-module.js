const defaultLogger = require('../logger');

const moduleObj = require('./data/module');

const createModule = async models => {
  try {
    const { Module: ModuleModel } = models;

    const modules = async () => {
      try {
        const moduleData = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const module of moduleObj) {
          // eslint-disable-next-line no-await-in-loop
          const count = await ModuleModel.count({
            where: { moduleKey: module.moduleKey },
          });
          if (!count) {
            moduleData.push(module);
          }
        }
        if (moduleData.length) {
          await ModuleModel.bulkCreate(moduleData);
        }
      } catch (error) {
        defaultLogger(`Error while bulk create modules > ${error}`, null, 'error');
        throw error;
      }
    };

    setTimeout(async () => {
      await modules();
    }, 10000);
  } catch (error) {
    defaultLogger(`Error while creating permission ${error}`, null, 'error');
  }
};

module.exports = createModule;
