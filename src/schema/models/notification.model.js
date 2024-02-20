const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model { }

  Notification.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('ALL_FREELANCERS_ASSIGNED', 'CLOCK_IN_REMINDER', 'CLOCK_OUT_REMINDER', 'DISPUTE_RAISED', 'DISPUTE_RESOLVED',
        'EVENT_CANCELLED', 'EVENT_TIMING_REMINDER', 'FREELANCER_ASSIGNED', 'FREELANCER_REVIEW_REMINDER', 'INSUFFICIENT_WORKING_HOURS',
        'ORGANIC_LEAD_ASSIGNED', 'ORGANIC_LEAD_SUBMITTED', 'PROFILE_APPROVED', 'PROFILE_COMPLETION_REMINDER', 'PROFILE_REJECTED',
        'PROFILE_UNDER_REVIEW', 'RECRUITER_REVIEW_REMINDER', 'REGULARIZATION_REQUEST_APPROVED', 'REGULARIZATION_REQUEST_APPROVED_RECRUITER',
        'REGULARIZATION_REQUEST_SUBMITTED', 'TOP_UP_REQUEST_APPROVED_FREELANCER', 'TOP_UP_REQUEST_APPROVED_RECRUITER',
        'TOP_UP_REQUEST_RECEIVED', 'UPFRONT_LEAD_SUBMITTED', 'WEDLANCER_COORDINATOR_ASSIGNED', 'UPFRONT_LEAD_ASSIGNED', 'FREELANCER_REMOVED'),
      allowNull: false,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    refId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    refType: {
      type: DataTypes.ENUM('EVENT', 'TOP_UP_REQUEST', 'USER', 'LEAD', 'DISPUTE', 'REGULARIZE_REQUEST', 'TRANSACTION'),
      allowNull: true,
    },
    refData: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    hasRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    actionRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  Notification.associate = models => {
    Notification.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator', targetKey: 'id' });
  };
  return Notification;
};
