/* eslint-disable max-len */
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model { }

  Role.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "Enter id", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    roleKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '{ "sequence": 2, "block": "required", "placeHolder": "Select role", "fieldSpecification": "DropDown", "multipleSelection": false }',
    },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['role_key'],
      },
    ],
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  Role.associate = models => {
    Role.hasMany(models.RoleModule, {
      foreignKey: 'roleKey',
      as: 'role',
      sourceKey: 'roleKey',
    });
  };

  return Role;
};
