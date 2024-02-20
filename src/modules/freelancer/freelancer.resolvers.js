const freelancerFieldResolvers = require('./field-resolvers/freelancer-field-resolvers');
const createCustomEvent = require('./mutations/create-custom-event');
const createFreelancer = require('./mutations/create-freelancer');
const createFreelancerProfile = require('./mutations/create-freelancer-profile');
const createPortfolio = require('./mutations/create-portfolio');
const createWebPortfolio = require('./mutations/create-web-portfolio');
const deleteWebCollectionAsset = require('./mutations/delete-web-collection-asset');
const deleteWebPortfolioCollection = require('./mutations/delete-web-portfolio-collection');
const removeCollection = require('./mutations/remove-collection');
const removeFreelancer = require('./mutations/remove-freelancer');
const updateCollection = require('./mutations/update-collection');
const updateFreelancerDetails = require('./mutations/update-freelancer-details');
const updateFreelancerWebBusinessDetails = require('./mutations/update-freelancer-web-business-details');
const updateFreelancerWebDetails = require('./mutations/update-freelancer-web-details');
const updateFreelancerWebProfile = require('./mutations/update-freelancer-web-profile');
const updateWebCollectionAsset = require('./mutations/update-web-collection-asset');
const updateWebPortfolioCollection = require('./mutations/update-web-portfolio-collection');
const getDashboardDetails = require('./queries/get-dashboard-details');
const getFeaturedWebCollectionAssets = require('./queries/get-featured-web-collection-assets');
const getFreelancerBadge = require('./queries/get-freelancer-badge');
const getFreelancerCategory = require('./queries/get-freelancer-category');
const getFreelancerCollection = require('./queries/get-freelancer-collection');
const getFreelancerDetails = require('./queries/get-freelancer-details');
const getFreelancerUpcomingEvents = require('./queries/get-freelancer-upcoming-events');
const getFreelancerWebBusinessDetails = require('./queries/get-freelancer-web-business-details');
const getFreelancerWebBusinessDetailsForVisitors = require('./queries/get-freelancer-web-business-details-for-visitors');
const getFreelancerWebDetails = require('./queries/get-freelancer-web-details');
const getFreelancerWebDetailsForVisitors = require('./queries/get-freelancer-web-details-for-visitors');
const getFreelancerWebProfileDetails = require('./queries/get-freelancer-web-profile-details');
const getFreelancerWebProfileDetailsForVisitors = require('./queries/get-freelancer-web-profile-details-for-visitors');
const getFreelancerWebReviews = require('./queries/get-freelancer-web-reviews');
const getFreelancerWebReviewsForVisitors = require('./queries/get-freelancer-web-reviews-for-visitors');
const getWebPortfolioCollection = require('./queries/get-web-portfolio-collection');
const getWebPortfolioCollectionForVisitors = require('./queries/get-web-portfolio-collection-for-visitors');
const listCollections = require('./queries/list-collections');
const listFreelancerWebPayments = require('./queries/list-freelancer-web-payments');
const listFreelancers = require('./queries/list-freelancers');
const listWebFreelancers = require('./queries/list-web-freelancers');
const listWebPortfolioCollections = require('./queries/list-web-portfolio-collections');
const listWebPortfolioCollectionsForVisitors = require('./queries/list-web-portfolio-collections-for-visitors');
const sendEmailForExportFreelancers = require('./queries/send-email-for-export-freelancers');
const webHomePageDetails = require('./queries/web-home-page-details');

const resolvers = {
  ...freelancerFieldResolvers,
  Mutation: {
    deleteWebPortfolioCollection,
    updateWebPortfolioCollection,
    createWebPortfolio,
    deleteWebCollectionAsset,
    updateWebCollectionAsset,
    updateFreelancerWebBusinessDetails,
    createCustomEvent,
    createFreelancer,
    updateFreelancerDetails,
    createPortfolio,
    removeCollection,
    removeFreelancer,
    updateCollection,
    createFreelancerProfile,
    updateFreelancerWebProfile,
    updateFreelancerWebDetails,
  },
  Query: {
    listFreelancerWebPayments,
    sendEmailForExportFreelancers,
    getFeaturedWebCollectionAssets,
    listWebFreelancers,
    listWebPortfolioCollectionsForVisitors,
    getWebPortfolioCollectionForVisitors,
    getFreelancerWebReviewsForVisitors,
    getFreelancerWebBusinessDetailsForVisitors,
    getFreelancerWebProfileDetailsForVisitors,
    getFreelancerWebDetailsForVisitors,
    listWebPortfolioCollections,
    getWebPortfolioCollection,
    getFreelancerWebReviews,
    getFreelancerWebBusinessDetails,
    getFreelancerWebDetails,
    getFreelancerWebProfileDetails,
    getFreelancerUpcomingEvents,
    getDashboardDetails,
    getFreelancerDetails,
    getFreelancerCategory,
    getFreelancerBadge,
    listFreelancers,
    getFreelancerCollection,
    listCollections,
    webHomePageDetails,
  },
};

module.exports = resolvers;
