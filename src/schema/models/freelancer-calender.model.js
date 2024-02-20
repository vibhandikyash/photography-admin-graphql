const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FreelancerCalender extends Model { }

  FreelancerCalender.init({
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
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    indexes: [
      {
        fields: ['start_date'],
      },
      {
        fields: ['event_id'],
      },
      {
        fields: ['end_date'],
      },
    ],
    sequelize,
    modelName: 'FreelancerCalender',
    tableName: 'freelancer_calenders',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  FreelancerCalender.associate = models => {
    FreelancerCalender.belongsTo(models.User, { foreignKey: 'userId', as: 'user', targetKey: 'id' });
    FreelancerCalender.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event', targetKey: 'id' });
    FreelancerCalender.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'editor', targetKey: 'id' });
  };
  return FreelancerCalender;
};
