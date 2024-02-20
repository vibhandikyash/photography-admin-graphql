const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ChatMessage extends Model { }

  ChatMessage.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    chatGroupId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    readBy: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
    },
  }, {
    sequelize,
    modelName: 'ChatMessage',
    tableName: 'chat_messages',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  ChatMessage.associate = models => {
    ChatMessage.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender', targetKey: 'id' });
    ChatMessage.belongsTo(models.ChatGroup, { foreignKey: 'chatGroupId', as: 'chatGroup', targetKey: 'id' });
  };
  return ChatMessage;
};
