const freelancerAverageRatingFieldResolver = require('./freelancer-average-rating-field-resolver');
const freelancerEventFieldResolver = require('./freelancer-event-field-resolver');
const freelancerProfileFieldResolver = require('./freelancer-profile-field-resolver');
const freelancerUserFieldResolver = require('./freelancer-user-field-resolver');

const freelancerFieldResolvers = {
  FreelancerRaw: {
    fullName: {
      resolve: FreelancerRaw => FreelancerRaw.full_name,
    },
    userName: {
      resolve: FreelancerRaw => FreelancerRaw.user_name,
    },
    email: {
      resolve: FreelancerRaw => FreelancerRaw.email,
    },
    verificationStatus: {
      resolve: FreelancerRaw => FreelancerRaw.verification_status,
    },
    contactNo: {
      resolve: FreelancerRaw => FreelancerRaw.contact_no,
    },
    role: {
      resolve: FreelancerRaw => FreelancerRaw.role,
    },
    isActive: {
      resolve: FreelancerRaw => FreelancerRaw.is_active,
    },
    updatedBy: {
      resolve: FreelancerRaw => FreelancerRaw.updated_by,
    },
    categoryName: {
      resolve: FreelancerRaw => FreelancerRaw.category_name,
    },
    location: {
      resolve: FreelancerRaw => FreelancerRaw.primary_location,
    },
    pricePerDay: {
      resolve: FreelancerRaw => FreelancerRaw.price_per_day,
    },
    typeKey: {
      resolve: FreelancerRaw => FreelancerRaw.type_key,
    },
    countryCode: {
      resolve: FreelancerRaw => FreelancerRaw.country_code,
    },
    aadharCardFront: {
      resolve: FreelancerRaw => FreelancerRaw.aadhar_card_front,
    },
    aadharCardBack: {
      resolve: FreelancerRaw => FreelancerRaw.aadhar_card_back,
    },
    badges: {
      resolve: FreelancerRaw => FreelancerRaw.user_badge,
    },
    isFeatured: {
      resolve: FreelancerRaw => FreelancerRaw.is_featured,
    },
  },
  FreelancerReview: {
    reviewer: freelancerUserFieldResolver,
    event: freelancerEventFieldResolver,
    averageRating: freelancerAverageRatingFieldResolver,
  },
  FreelancerProfileDetails: {
    profilePhoto: freelancerProfileFieldResolver,
    coverPhoto: freelancerProfileFieldResolver,
    aadharCardBack: freelancerProfileFieldResolver,
    aadharCardFront: freelancerProfileFieldResolver,
  },
};

module.exports = freelancerFieldResolvers;
