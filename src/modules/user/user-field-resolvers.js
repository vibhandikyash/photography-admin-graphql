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
  WedlancerCoordinatorRaw: {
    fullName: {
      resolve: WedlancerCoordinatorRaw => WedlancerCoordinatorRaw.full_name,
    },
    userName: {
      resolve: WedlancerCoordinatorRaw => WedlancerCoordinatorRaw.user_name,
    },
    startDate: {
      resolve: WedlancerCoordinatorRaw => WedlancerCoordinatorRaw.start_date,
    },
    endDate: {
      resolve: WedlancerCoordinatorRaw => WedlancerCoordinatorRaw.end_date,
    },
    eventLocation: {
      resolve: WedlancerCoordinatorRaw => WedlancerCoordinatorRaw.event_location,
    },
    eventName: {
      resolve: WedlancerCoordinatorRaw => WedlancerCoordinatorRaw.event_name,
    },
    contactNo: {
      resolve: WedlancerCoordinatorRaw => WedlancerCoordinatorRaw.contact_no,
    },
    countryCode: {
      resolve: WedlancerCoordinatorRaw => WedlancerCoordinatorRaw.country_code,
    },
    eventId: {
      resolve: WedlancerCoordinatorRaw => WedlancerCoordinatorRaw.event_id,
    },
    eventLocationDetails: {
      resolve: WedlancerCoordinatorRaw => WedlancerCoordinatorRaw.event_location_details,
    },
    eventStatus: {
      resolve: WedlancerCoordinatorRaw => WedlancerCoordinatorRaw.event_status,
    },
    eventType: {
      resolve: WedlancerCoordinatorRaw => WedlancerCoordinatorRaw.event_type,
    },
  },
};

module.exports = userFieldResolvers;
