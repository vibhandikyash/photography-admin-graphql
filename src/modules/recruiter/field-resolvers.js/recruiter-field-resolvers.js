const recruiterProfileFieldResolver = require('./recruiter-profile-field-resolver');

const recruiterFieldResolvers = {
  RecruiterRaw: {
    fullName: {
      resolve: RecruiterRaw => RecruiterRaw.full_name,
    },
    userName: {
      resolve: RecruiterRaw => RecruiterRaw.user_name,
    },
    email: {
      resolve: RecruiterRaw => RecruiterRaw.email,
    },
    verificationStatus: {
      resolve: RecruiterRaw => RecruiterRaw.verification_status,
    },
    contactNo: {
      resolve: RecruiterRaw => RecruiterRaw.contact_no,
    },
    role: {
      resolve: RecruiterRaw => RecruiterRaw.role,
    },
    isActive: {
      resolve: RecruiterRaw => RecruiterRaw.is_active,
    },
    updatedBy: {
      resolve: RecruiterRaw => RecruiterRaw.updated_by,
    },
    companyName: {
      resolve: RecruiterRaw => RecruiterRaw.company_name,
    },
    typeKey: {
      resolve: RecruiterRaw => RecruiterRaw.type_key,
    },
    aadharCardFront: {
      resolve: RecruiterRaw => RecruiterRaw.aadhar_card_front,
    },
    aadharCardBack: {
      resolve: RecruiterRaw => RecruiterRaw.aadhar_card_back,
    },
    countryCode: {
      resolve: RecruiterRaw => RecruiterRaw.country_code,
    },
  },
  RecruiterProfileDetails: {
    profilePhoto: recruiterProfileFieldResolver,
    coverPhoto: recruiterProfileFieldResolver,
    aadharCardBack: recruiterProfileFieldResolver,
    aadharCardFront: recruiterProfileFieldResolver,
  },
};

module.exports = recruiterFieldResolvers;
