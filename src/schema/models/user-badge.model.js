const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserBadge extends Model { }

  UserBadge.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    badgeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    assignedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    indexes: [
      {
        fields: ['badge_id'],
      },
      {
        fields: ['assigned_by'],
      },
    ],
    sequelize,
    modelName: 'UserBadge',
    tableName: 'user_badges',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });
  UserBadge.associate = models => {
    UserBadge.belongsTo(models.User, { foreignKey: 'userId', as: 'user', targetKey: 'id' });
    UserBadge.belongsTo(models.Badge, { foreignKey: 'badgeId', as: 'userBadge', targetKey: 'id' });
    UserBadge.belongsTo(models.User, { foreignKey: 'assignedBy', as: 'assignee', targetKey: 'id' });
  };
  return UserBadge;
};
