/* eslint-disable max-len */
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Module extends Model { }

  Module.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "Enter id", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    moduleKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '{ "sequence": 2, "block": "required", "placeHolder": "Select role", "fieldSpecification": "DropDown", "multipleSelection": false }',
    },
  }, {
    indexes: [
      {
        fields: ['module_key'],
      },
    ],
    sequelize,
    modelName: 'Module',
    tableName: 'modules',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  Module.associate = models => {
    Module.hasMany(models.RoleModule, {
      foreignKey: 'moduleKey',
      as: 'module',
      sourceKey: 'moduleKey',
    });
  };

  return Module;
};
