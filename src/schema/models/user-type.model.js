const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserType extends Model { }

  UserType.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('FREELANCER', 'RECRUITER'),
      defaultValue: 'FREELANCER',
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    indexes: [
      {
        fields: ['key'],
      },
    ],
    sequelize,
    modelName: 'UserType',
    tableName: 'user_types',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });
  UserType.associate = models => {
    UserType.hasMany(models.UserProfile, { foreignKey: 'typeKey', as: 'userType', targetKey: 'key' });
  };
  return UserType;
};
