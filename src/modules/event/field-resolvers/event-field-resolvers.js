const { isNaN } = require('lodash');

const eventCancelledByUserFieldResolver = require('./event-cancelled-by-user-field-resolver');

const eventCityFieldResolver = require('./event-city-field-resolver');
const eventCreatorFieldResolver = require('./event-creator-field-resolver');
const eventFreelancerCategoryFieldResolver = require('./event-freelancer-category-field-resolver');
const eventFreelancerFieldResolver = require('./event-freelancer-field-resolver');
const eventRecruiterFieldResolver = require('./event-recruiter-field-resolver');
const eventReviewedToFieldResolver = require('./event-reviewed-to-field-resolver');
const eventReviewerFieldResolver = require('./event-reviewer-field-resolver');
const eventReviewsFieldResolver = require('./event-reviews-field-resolver');
const eventStateFieldResolver = require('./event-state-field-resolver');
const eventUpfrontCategoryFieldResolver = require('./event-upfront-category-field-resolver');
const eventWedlancerCoordinatorFieldResolver = require('./event-wedlancer-coordinator-field-resolver');

const eventFieldResolvers = {
  EventRaw: {
    name: {
      resolve: EventRaw => EventRaw.name,
    },
    status: {
      resolve: EventRaw => EventRaw.status,
    },
    leadType: {
      resolve: EventRaw => EventRaw.lead_type,
    },
    startDate: {
      resolve: EventRaw => EventRaw.start_date,
    },
    endDate: {
      resolve: EventRaw => EventRaw.end_date,
    },
    recruiterType: {
      resolve: EventRaw => EventRaw.recruiter_type,
    },
    recruiterName: {
      resolve: EventRaw => EventRaw.recruiter_name,
    },
    recruiterId: {
      resolve: EventRaw => EventRaw.recruiter_id,
    },
    wedlancerCoordinator: {
      resolve: EventRaw => EventRaw.wedlancer_coordinator,
    },
    createdBy: {
      resolve: EventRaw => EventRaw.created_by,
    },
    location: {
      resolve: EventRaw => EventRaw.location,
    },
    eventLocationDetails: {
      resolve: EventRaw => EventRaw.event_location_details,
    },
  },
  FreelancerAvailabilityRaw: {
    userName: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.user_name,
    },
    fullName: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.full_name,
    },
    contactNo: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.contact_no,
    },
    countryCode: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.country_code,
    },
    category: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.category,
    },
    primaryLocation: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.primary_location,
    },
    secondaryLocation: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.secondary_location,
    },
    primaryLocationDetails: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.primary_location_details,
    },
    secondaryLocationDetails: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.secondary_location_details,
    },
    pricePerDay: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.price_per_day,
    },
    userBadge: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.user_badge,
    },
    startDate: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.start_date,
    },
    endDate: {
      resolve: FreelancerAvailabilityRaw => FreelancerAvailabilityRaw.end_date,
    },
    ratings: {
      resolve: FreelancerAvailabilityRaw => {
        if (isNaN(FreelancerAvailabilityRaw.average_rating)) {
          return 0;
        }
        return FreelancerAvailabilityRaw.average_rating;
      },
    },
  },
  LocationDetails: {
    locationName: {
      resolve: LocationDetails => LocationDetails.locationName || LocationDetails.location_name,
    },
    id: {
      resolve: LocationDetails => LocationDetails.id,
    },
  },
  EventDetails: {
    recruiter: eventRecruiterFieldResolver,
    wedlancerCoordinator: eventWedlancerCoordinatorFieldResolver,
    city: eventCityFieldResolver,
    state: eventStateFieldResolver,
    creator: eventCreatorFieldResolver,
    cancelledByUser: eventCancelledByUserFieldResolver,
  },
  Review: {
    event: eventReviewsFieldResolver,
    reviewedTo: eventReviewedToFieldResolver,
    reviewer: eventReviewerFieldResolver,
  },
  UpfrontCategories: {
    category: eventUpfrontCategoryFieldResolver,
  },
  EventFreelancers: {
    category: eventFreelancerCategoryFieldResolver,
    user: eventFreelancerFieldResolver,
  },
  Freelancers: {
    category: eventFreelancerCategoryFieldResolver,
  },
};

module.exports = eventFieldResolvers;
