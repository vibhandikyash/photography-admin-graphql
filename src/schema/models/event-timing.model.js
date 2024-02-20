const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EventTiming extends Model { }

  EventTiming.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'EventTiming',
    tableName: 'event_timings',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  EventTiming.associate = models => {
    EventTiming.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event', targetKey: 'id' });
    EventTiming.hasMany(models.FreelancerAttendance, { foreignKey: 'eventTimingsId', as: 'eventTimings', targetKey: 'id' });
    EventTiming.hasMany(models.RegularizeRequest, { foreignKey: 'eventTimingId', as: 'regularizeRequests', targetKey: 'id' });
  };
  return EventTiming;
};
