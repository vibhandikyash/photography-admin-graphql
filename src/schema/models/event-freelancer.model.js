const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EventFreelancer extends Model { }

  EventFreelancer.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    eventCategoryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    finalizedPrice: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    isAssigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isRequested: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    indexes: [
      {
        fields: ['event_id'],
      },
      {
        fields: ['event_category_id'],
      },
    ],
    sequelize,
    modelName: 'EventFreelancer',
    tableName: 'event_freelancers',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  EventFreelancer.associate = models => {
    EventFreelancer.belongsTo(models.User, { foreignKey: 'userId', as: 'eventFreelancers', targetKey: 'id' });
    EventFreelancer.belongsTo(models.Event, { foreignKey: 'eventId', as: 'events', targetKey: 'id' });
    EventFreelancer.belongsTo(models.UpfrontCategoryRequirement, { foreignKey: 'eventCategoryId', as: 'freelancerCategory', targetKey: 'id' });
  };
  return EventFreelancer;
};
