const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Badge extends Model { }

  Badge.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "id", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      comment: '{ "sequence": 2, "block": "required", "placeHolder": "name", "fieldSpecification": "Name", "multipleSelection": false }',
    },
  }, {
    indexes: [
      {
        fields: ['name'],
      },
    ],
    sequelize,
    modelName: 'Badge',
    tableName: 'badges',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });
  Badge.associate = models => {
    Badge.hasMany(models.UserBadge, {
      foreignKey: 'badgeId',
      as: 'userBadge',
    });
  };
  return Badge;
};
