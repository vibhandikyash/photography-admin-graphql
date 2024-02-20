/* eslint-disable max-len */
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model { }

  Transaction.init({
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
    amount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    transactionType: {
      type: DataTypes.ENUM('BOOKING_FEES', 'TRAINING_FEES', 'INITIAL_FEES', 'ADDITIONAL_BOOKING_FEES', 'CANCELLATION_CHARGES', 'TOP_UP', 'REFUND', 'WAIVE_OFF', 'CONVENIENCE_FEES', 'EVENT_FEES', 'COMMISSION'),
    },
    transactionSubType: {
      type: DataTypes.ENUM('BOOKING_FEES', 'TRAINING_FEES', 'INITIAL_FEES', 'ADDITIONAL_BOOKING_FEES', 'CANCELLATION_CHARGES', 'TOP_UP', 'CONVENIENCE_FEES', 'EVENT_FEES'),
    },
    modeOfTransaction: {
      type: DataTypes.ENUM('ONLINE', 'CHEQUE', 'CASH'),
      defaultValue: 'CASH',
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    transactionStatus: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'PENDING',
    },
    closingBalance: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    freelancerId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    groupId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metaData: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    seriesNo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      autoIncrement: true,
    },
  }, {
    indexes: [
      {
        fields: ['amount'],
      },
      {
        fields: ['transaction_type'],
      },
      {
        fields: ['mode_of_transaction'],
      },
    ],
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  Transaction.associate = models => {
    Transaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user', targetKey: 'id' });
    Transaction.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event', targetKey: 'id' });
    Transaction.belongsTo(models.User, { foreignKey: 'freelancerId', as: 'freelancer', targetKey: 'id' });
  };
  return Transaction;
};
