/* eslint-disable no-restricted-syntax */

const moment = require('moment');

const { WEB_URL } = require('../../../config/config');

const {
  CONFIGURATION_KEYS: { REGULARIZE_REQUEST_PRICE_MULTIPLIER, CONVENIENCE_FEES },
  DEFAULT_TIMEZONE, REGULARIZE_REQUEST_VALIDATION_HOURS,
  REGULARIZE_REQUEST_VALIDATION_END_TIME,
} = require('../../../constants/service-constants');

const defaultLogger = require('../../../logger');
const {
  Event: EventModel, User: UserModel, City: CityModel, EventFreelancer: EventFreelancerModel,
  UserBusiness: UserBusinessModel, Category: CategoryModel, EventTiming: EventTimingModel,
} = require('../../../sequelize-client');
const { getConfigByKey } = require('../../configurations');
const sendEmail = require('../../sendgrid');
const { FREELANCER_ASSIGNED } = require('../constants/email-template-constants');
const formatEmailDateWithTimeZone = require('../services/format-email-date-with-time-zone');

const sendEmailForFreelancerAssigned = async (eventId, userId) => {
  try {
    const [regularizeRequestPriceMultiplier, convenienceFee] = await getConfigByKey([REGULARIZE_REQUEST_PRICE_MULTIPLIER, CONVENIENCE_FEES]);
    const assignedFreelancer = await EventFreelancerModel.findOne({
      where: { eventId, userId, isAssigned: true },
      attributes: ['finalizedPrice'],
      include: [
        {
          model: EventModel,
          as: 'events',
          attributes: ['id', 'name', 'startDate', 'endDate', 'timeZone'],
          include: [
            {
              model: CityModel,
              as: 'cities',
              attributes: ['name'],
            },
            {
              model: UserModel,
              as: 'recruiter',
              attributes: ['id', 'fullName', 'email', 'contactNo'],
            },
            {
              model: EventTimingModel,
              as: 'timings',
            },
            {
              model: UserModel,
              as: 'assignee',
              attributes: ['fullName', 'contactNo', 'countryCode'],
            },
          ],
        },
        {
          model: UserModel,
          as: 'eventFreelancers',
          attributes: ['fullName', 'countryCode', 'contactNo'],
          include: [
            {
              model: UserBusinessModel,
              as: 'business',
              attributes: ['id'],
              include: {
                model: CategoryModel,
                as: 'userCategory',
                attributes: ['name'],
              },
            },
          ],
        },
      ],
    });

    const {
      finalizedPrice,
      eventFreelancers: {
        fullName: freelancerName, countryCode: freelancerCountryCode, contactNo: freelancerContactNo,
        business: { userCategory: { name: category } = {} } = {},
      },
      events: {
        name: eventName, startDate, endDate, timeZone = DEFAULT_TIMEZONE,
        cities: { name: eventLocation } = {},
        recruiter: {
          id: recruiterId, fullName: recruiterName, email: recruiterEmail, contactNo: recruiterContactNo,
        } = {},
        timings: eventTimings,
        assignee = {},
      },
    } = assignedFreelancer;

    let wedlancerCoordinatorData;
    if (assignee) {
      const { fullName: wedlancerCoordinatorName, contactNo: wedlancerCoordinatorContactNo, countryCode: wedlancerCoordinatorCountryCode } = assignee;
      wedlancerCoordinatorData = {
        wedlancerCoordinatorName,
        wedlancerCoordinatorContactNo,
        wedlancerCoordinatorCountryCode,
      };
    }
    let totalNoOfDays = 0;
    for (const eventTime of eventTimings) {
      const { endDate: endedAt, startDate: startedAt } = eventTime;

      const localStartedAt = moment(startedAt).tz(timeZone).format(); // LOCAL STARTED AT (DEFAULT TIMEZONE ASIA/KOLKATA)
      const localEndedAt = moment(endedAt).tz(timeZone).format(); // LOCAL ENDED AT (DEFAULT TIMEZONE ASIA/KOLKATA)
      const localStartedAtNextDay = moment(localStartedAt).tz(timeZone).add(1, 'days'); // LOCAL NEXT DAY OF STARTED AT (DEFAULT TIMEZONE ASIA/KOLKATA)

      const hoursDiff = moment(endedAt).diff(startedAt, 'hours');
      const endTime = moment(localEndedAt).tz(timeZone).format('HH'); // fetch end time in hours

      const isSameEndDate = moment(localStartedAtNextDay).isSame(localEndedAt, 'day'); // check event end on same day

      // check for hours and event time for extra charges
      if (hoursDiff > REGULARIZE_REQUEST_VALIDATION_HOURS && isSameEndDate && endTime > REGULARIZE_REQUEST_VALIDATION_END_TIME) {
        totalNoOfDays += parseFloat(regularizeRequestPriceMultiplier);
      } else {
        totalNoOfDays += 1;
      }
    }

    // fetch total balance
    const { totalBalance } = await UserBusinessModel.findOne({ where: { userId: recruiterId }, attributes: ['totalBalance'] });
    const convenienceFees = convenienceFee * totalNoOfDays;
    const totalAmount = finalizedPrice * totalNoOfDays + convenienceFees;

    const templateData = {
      templateKey: FREELANCER_ASSIGNED,
      toEmailAddress: recruiterEmail,
      data: {
        recruiterName,
        eventName,
        eventLocation,
        eventStartDate: formatEmailDateWithTimeZone(startDate, timeZone),
        eventEndDate: formatEmailDateWithTimeZone(endDate, timeZone),
        category: category.toLowerCase(),
        freelancerName,
        freelancerCountryCode,
        freelancerContactNo,
        finalizedPrice,
        freelancerProfileLink: `${WEB_URL}verify/?contact=${recruiterContactNo}&event_id=${eventId}`,
        totalNoOfDays,
        convenienceFees,
        totalAmount,
        totalBalance,
        wedlancerCoordinatorData,
      },
      attachments: [],
    };

    //! REMOVED BECAUSE OF CLIENT REQUIREMENT #WEDL-2390

    // const { Body: invoiceBufferData = '' } = await getObject(PRIVATE_BUCKET_NAME, key);

    // if (invoiceBufferData) {
    //   templateData.attachments.push({
    //     content: invoiceBufferData.toString('base64'),
    //     filename: 'invoice.pdf',
    //     type: INVOICE_CONTENT_TYPE,
    //     disposition: 'attachment',
    //   });
    // }

    sendEmail(templateData);
  } catch (error) {
    defaultLogger(`Error from sendEmailForFreelancerAssigned : ${error}`, null, 'error');
  }
};

module.exports = sendEmailForFreelancerAssigned;
