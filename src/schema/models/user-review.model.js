const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserReview extends Model { }

  UserReview.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    reviewerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    overAllRating: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    communicationRating: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    punctualityRating: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
  }, {
    indexes: [
      {
        fields: ['reviewer_id'],
      },
      {
        fields: ['event_id'],
      },
      {
        fields: ['user_id'],
      },
    ],
    sequelize,
    modelName: 'UserReview',
    tableName: 'user_reviews',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  UserReview.associate = models => {
    UserReview.belongsTo(models.User, { foreignKey: 'userId', as: 'user', targetKey: 'id' });
    UserReview.belongsTo(models.User, { foreignKey: 'reviewerId', as: 'reviewer', targetKey: 'id' });
    UserReview.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event', targetKey: 'id' });
  };
  return UserReview;
};
