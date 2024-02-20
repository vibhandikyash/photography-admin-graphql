const changePassword = require('./mutations/change-password');
const createUser = require('./mutations/create-user');
const deleteUser = require('./mutations/delete-user');
const forgotUserPassword = require('./mutations/forgot-user-password');
const login = require('./mutations/login');
const logout = require('./mutations/logout');
const register = require('./mutations/register');
const setUserPassword = require('./mutations/set-user-password');
const submitContactInquiry = require('./mutations/submit-contact-inquiry');
const updatePermission = require('./mutations/update-permission');
const updateUser = require('./mutations/update-user');
const verifyOtp = require('./mutations/verify-otp');
const webLogin = require('./mutations/web-login');
const getLoggedInUser = require('./queries/get-logged-in-user');
const getUserPermission = require('./queries/get-user-permission');
const isValidToken = require('./queries/is-valid-token');
const user = require('./queries/user');
const userFilters = require('./queries/user-filters');
const users = require('./queries/users');
const wedlancerCoordinators = require('./queries/wedlancer-coordinators');
const wedlancerCoordinatorsForEvent = require('./queries/wedlancer-coordinators-for-event');
const userFieldResolvers = require('./user-field-resolvers');

const resolvers = {
  ...userFieldResolvers,
  Query: {
    users,
    user,
    userFilters,
    getLoggedInUser,
    isValidToken,
    getUserPermission,
    wedlancerCoordinatorsForEvent,
    wedlancerCoordinators,
  },
  Mutation: {
    createUser,
    updateUser,
    deleteUser,
    login,
    logout,
    changePassword,
    forgotUserPassword,
    setUserPassword,
    updatePermission,
    webLogin,
    verifyOtp,
    register,
    submitContactInquiry,
  },
};

module.exports = resolvers;
