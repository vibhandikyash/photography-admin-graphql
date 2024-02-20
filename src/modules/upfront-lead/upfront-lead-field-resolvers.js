const userFieldResolvers = {
  UserRaw: {
    fullName: {
      resolve: UserRaw => UserRaw.full_name,
    },
    userName: {
      resolve: UserRaw => UserRaw.user_name,
    },
    email: {
      resolve: UserRaw => UserRaw.email,
    },
    verificationStatus: {
      resolve: UserRaw => UserRaw.verification_status,
    },
    contactNo: {
      resolve: UserRaw => UserRaw.contact_no,
    },
    countryCode: {
      resolve: UserRaw => UserRaw.country_code,
    },
    role: {
      resolve: UserRaw => UserRaw.role,
    },
    isFeatured: {
      resolve: UserRaw => UserRaw.is_featured,
    },
    isActive: {
      resolve: UserRaw => UserRaw.is_active,
    },
    updatedBy: {
      resolve: UserRaw => UserRaw.updated_by,
    },
  },
};

module.exports = userFieldResolvers;
