const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RegularizeRequest extends Model { }

  RegularizeRequest.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    actionTakenBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    eventId: {
      type: DataTypes.UUID,
    },
    eventTimingId: {
      type: DataTypes.UUID,
    },
    requestType: {
      type: DataTypes.ENUM('REGULARIZE', 'INSUFFICIENT_HOURS'),
    },
    metaData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ticketNo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      autoIncrement: true,
    },
  }, {
    sequelize,
    modelName: 'RegularizeRequest',
    tableName: 'regularize_requests',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  RegularizeRequest.associate = models => {
    RegularizeRequest.belongsTo(models.User, { foreignKey: 'userId', as: 'user', targetKey: 'id' });
    RegularizeRequest.belongsTo(models.User, { foreignKey: 'actionTakenBy', as: 'actionBy', targetKey: 'id' });
    RegularizeRequest.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event', targetKey: 'id' });
    RegularizeRequest.belongsTo(models.EventTiming, { foreignKey: 'eventTimingId', as: 'eventTiming', targetKey: 'id' });
  };
  return RegularizeRequest;
};
