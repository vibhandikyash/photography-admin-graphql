/* eslint-disable max-len */
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RoleModule extends Model { }

  RoleModule.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "Enter id", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    moduleKey: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '{ "sequence": 2, "block": "required", "placeHolder": "Enter permission", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    roleKey: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '{ "sequence": 3, "block": "required", "placeHolder": "Enter role", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    fullAccess: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '{ "sequence": 4, "block": "required", "placeHolder": "Full access", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    moderateAccess: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '{ "sequence": 5, "block": "required", "placeHolder": "moderate access", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    readOnlyAccess: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '{ "sequence": 6, "block": "required", "placeHolder": "read only access", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    noAccess: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '{ "sequence": 7, "block": "required", "placeHolder": "no access", "fieldSpecification": "Name", "multipleSelection": false }',
    },
  }, {
    indexes: [
      {
        fields: ['role_key', 'module_key'],
        method: 'gin',
      },
    ],
    sequelize,
    modelName: 'RoleModule',
    tableName: 'role_modules',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  RoleModule.associate = models => {
    RoleModule.belongsTo(models.Role, { foreignKey: 'roleKey', as: 'userRoleKey', targetKey: 'roleKey' });
    RoleModule.belongsTo(models.Module, { foreignKey: 'moduleKey', as: 'userModuleKey', targetKey: 'moduleKey' });
  };

  return RoleModule;
};
