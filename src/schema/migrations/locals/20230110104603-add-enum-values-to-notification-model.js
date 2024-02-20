module.exports = {
  async up(queryInterface) {
    queryInterface.sequelize.query('ALTER TYPE "enum_notifications_type" ADD VALUE \'FREELANCER_REMOVED\'');
    queryInterface.sequelize.query('ALTER TYPE "enum_notifications_type" ADD VALUE \'UPFRONT_LEAD_ASSIGNED\'');
  },
};
