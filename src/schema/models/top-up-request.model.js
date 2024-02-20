const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TopUpRequest extends Model { }

  TopUpRequest.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    dateOfPayment: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    modeOfPayment: {
      type: DataTypes.ENUM('CASH', 'ONLINE'),
      defaultValue: 'CASH',
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'),
      defaultValue: 'PENDING',
    },
    seriesNo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      autoIncrement: true,
    },
  }, {
    sequelize,
    modelName: 'TopUpRequest',
    tableName: 'top_up_requests',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  TopUpRequest.associate = models => {
    TopUpRequest.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender', targetKey: 'id' });
    TopUpRequest.belongsTo(models.User, { foreignKey: 'receiverId', as: 'receiver', targetKey: 'id' });
    TopUpRequest.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event', targetKey: 'id' });
  };
  return TopUpRequest;
};
