const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ChatGroup extends Model { }

  ChatGroup.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('ONE_TO_ONE', 'GROUP'),
      allowNull: false,
    },
    refId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    refType: {
      type: DataTypes.ENUM('EVENT'),
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'ChatGroup',
    tableName: 'chat_groups',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  ChatGroup.associate = models => {
    ChatGroup.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator', targetKey: 'id' });
    ChatGroup.hasMany(models.ChatMember, { foreignKey: 'chatGroupId', as: 'chatMembers', targetKey: 'id' });
    ChatGroup.hasMany(models.ChatMessage, { foreignKey: 'chatGroupId', as: 'chatMessages', targetKey: 'id' });
  };
  return ChatGroup;
};
