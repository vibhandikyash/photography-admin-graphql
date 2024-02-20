/* eslint-disable new-cap */
const fs = require('fs');
const path = require('path');

const hbs = require('handlebars');

const { logger } = require('../../../../logger');

const generateCompiledHbs = (hbsFilePath, data) => {
  try {
    const compiledContent = hbs.compile(fs.readFileSync(path.join(__dirname, hbsFilePath), 'utf8'));
    const content = compiledContent({ ...data });
    return new Buffer.from(content);
  } catch (error) {
    logger.error('Error from generateCompiledHbs:', error);
    throw error;
  }
};

module.exports = generateCompiledHbs;
