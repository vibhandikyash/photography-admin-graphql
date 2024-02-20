// /* eslint-disable security/detect-non-literal-fs-filename */
// /* eslint-disable security/detect-object-injection */
// /* eslint-disable no-await-in-loop */
// /* eslint-disable no-restricted-syntax */
// /* eslint-disable no-useless-catch */
// const defaultLogger = require('../logger');

// const createCountriesCityState = async models => {
//   try {
//     const { State: StateModel, Countries: CountryModel, City: CitiesModel } = models;
//     // eslint-disable-next-line global-require
//     const combineJsonData = require('./country-data/combined.json');
//     const combineDataArray = [];

//     for (const data of combineJsonData) {
//       const checkUniqueCountry = await CountryModel.findOne({
//         where: { name: data.name },
//       });
//       if (!checkUniqueCountry) {
//         combineDataArray.push(data);
//       }
//     }
//     if (combineDataArray && combineDataArray.length) {
//       const countriesCityState = async () => {
//         try {
//           await CountryModel.bulkCreate(combineDataArray, {
//             include: [
//               {
//                 model: StateModel,
//                 as: 'state',
//                 include: [
//                   {
//                     model: CitiesModel,
//                     as: 'cities',
//                   },
//                 ],
//               },
//             ],
//           });
//         } catch (error) {
//           throw error;
//         }
//       };
//       // CREATE COUNTRIES
//       setTimeout(async () => {
//         await countriesCityState();
//       }, 50000);
//     }
//   } catch (error) {
//     defaultLogger(`Error while creating cities ${error}`, null, 'error');
//   }
// };

// module.exports = createCountriesCityState;
