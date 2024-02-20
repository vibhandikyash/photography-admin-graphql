const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AccessToken extends Model { }

  AccessToken.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'AccessToken',
    tableName: 'access_tokens',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  AccessToken.associate = models => {
    AccessToken.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'userToken',
    });
  };
  return AccessToken;
};
