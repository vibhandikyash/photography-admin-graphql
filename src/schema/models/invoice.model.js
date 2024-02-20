const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model { }

  Invoice.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    seriesNo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.UUID,
    },
    eventId: {
      type: DataTypes.UUID,
    },
    type: {
      type: DataTypes.ENUM('FREELANCER_ASSIGNMENT', 'REFUND', 'DEBIT_NOTE', 'CONVENIENCE_FEES', 'COMMISSION'),
    },
    key: {
      type: DataTypes.STRING,
    },
  }, {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });
  Invoice.associate = models => {
    Invoice.belongsTo(models.User, { foreignKey: 'userId', as: 'user', targetKey: 'id' });
    Invoice.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event', targetKey: 'id' });
  };
  return Invoice;
};
