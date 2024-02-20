require('dotenv').config();
const http = require('http');

const cors = require('cors');
const express = require('express');

const packageJson = require('../package.json');

const bootFiles = require('./boot');
const CONFIG = require('./config/config');
const { logger } = require('./logger');
const restRoutes = require('./rest'); // Rest api routes
const setLocaleServiceInReq = require('./rest/middlewares/set-locale-service-in-req');
const sequelizeClient = require('./sequelize-client');
const startApolloServer = require('./start-apollo-server');
const i18n = require('./utils/intl/i18n-config');
const LocaleService = require('./utils/intl/locale-service');
const queryLengthMiddleware = require('./utils/query-length-middleware.js');

const { models } = sequelizeClient;

const app = express();
const corsOptions = { credentials: true, origin: true };

const localeService = new LocaleService(i18n);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(setLocaleServiceInReq(localeService));
app.use('*', queryLengthMiddleware);
/** Rest API */
app.use(`/${CONFIG.API_PREFIX_ROUTE}/app/`, restRoutes);

app.get(`/${CONFIG.API_PREFIX_ROUTE}/version`, (req, res) => { res.json({ version: packageJson.version }); });

const initServer = async () => {
  try {
    startApolloServer(app);
    const httpServer = http.createServer(app);
    await sequelizeClient.sequelize.sync();
    httpServer.listen(CONFIG.PORT, () => {
      logger.info(`🚀 Server ready at http://localhost:${CONFIG.PORT}/${CONFIG.API_PREFIX_ROUTE}/graphql`);
    });
    // ON BOOT
    bootFiles(models);
    return true;
  } catch (error) {
    logger.error(error);
    return error;
  }
};

initServer();

module.exports = app;
