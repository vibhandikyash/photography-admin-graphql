const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Dispute extends Model { }

  Dispute.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    ticketNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    raisedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('RESOLVED', 'PENDING'),
      defaultValue: 'PENDING',
    },
  }, {
    indexes: [
      {
        fields: ['event_id'],
      },
      {
        fields: ['message'],
      },
      {
        fields: ['user_id'],
      },
    ],
    sequelize,
    modelName: 'Dispute',
    tableName: 'disputes',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  Dispute.associate = models => {
    Dispute.belongsTo(models.User, { foreignKey: 'userId', as: 'user', targetKey: 'id' });
    Dispute.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event', targetKey: 'id' });
    Dispute.belongsTo(models.User, { foreignKey: 'raisedBy', as: 'creator', targetKey: 'id' });
  };
  return Dispute;
};
