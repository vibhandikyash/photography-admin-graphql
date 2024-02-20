const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ChatMember extends Model { }

  ChatMember.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    chatGroupId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'ChatMember',
    tableName: 'chat_members',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  ChatMember.associate = models => {
    ChatMember.belongsTo(models.User, { foreignKey: 'userId', as: 'user', targetKey: 'id' });
    ChatMember.belongsTo(models.ChatGroup, { foreignKey: 'chatGroupId', as: 'chatGroup', targetKey: 'id' });
  };
  return ChatMember;
};
