const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Configuration extends Model { }

  Configuration.init({
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    indexes: [
      {
        fields: ['key'],
      },
    ],
    sequelize,
    modelName: 'Configuration',
    tableName: 'configurations',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });
  return Configuration;
};
