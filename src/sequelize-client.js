/* eslint-disable import/no-dynamic-require */
/* eslint-disable security/detect-non-literal-require */

const fs = require('fs');
const path = require('path');

const Sequelize = require('sequelize');

const { ENV: NODE_ENV } = require('./config/config');

const basename = path.basename(__filename);
const env = NODE_ENV || 'development';

const socialFeedPath = path.join(__dirname, './schema');
const config = require(`${socialFeedPath}/migrations/config.js`)[env]; // READING CONFIG FILE

const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// LOADING MODELs FROM SOCIAL-FEED FOLDER
const socialFeedModelPath = path.join(socialFeedPath, '/models');

fs
  .readdirSync(socialFeedModelPath)
  .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach(file => {
    // eslint-disable-next-line global-require
    const model = require(path.join(socialFeedModelPath, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.models = sequelize.models; // ADDING MODEL

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
