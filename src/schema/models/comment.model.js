const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Comment extends Model { }

  Comment.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    receiverId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    indexes: [
      {
        fields: ['message'],
      },
      {
        fields: ['sender_id'],
      },
      {
        fields: ['receiver_id'],
      },
      {
        fields: ['event_id'],
      },
    ],
    sequelize,
    modelName: 'Comment',
    tableName: 'comments',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  Comment.associate = models => {
    Comment.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender', targetKey: 'id' });
    Comment.belongsTo(models.User, { foreignKey: 'receiverId', as: 'receiver', targetKey: 'id' });
    Comment.belongsTo(models.Event, { foreignKey: 'eventId', as: 'eventComment', targetKey: 'id' });
  };
  return Comment;
};
