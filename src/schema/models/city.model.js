const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class City extends Model { }

  City.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "city name", "fieldSpecification": "DropDown", "multipleSelection": false }',
    },
    stateId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    assetUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    stateCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    countryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    flag: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    wikiDataId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 9999,
    },
  }, {
    indexes: [
      {
        fields: ['state_id'],
      },
      {
        fields: ['country_id'],
      },
      {
        fields: ['state_code'],
      },
      {
        fields: ['country_code'],
      },
      {
        fields: ['name'],
      },
    ],
    sequelize,
    modelName: 'City',
    tableName: 'cities',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });
  City.associate = models => {
    City.belongsTo(models.Country, {
      foreignKey: 'country_id',
      as: 'country',
    });
    City.belongsTo(models.State, {
      foreignKey: 'state_id',
      as: 'state',
    });
    City.hasMany(models.Event, {
      foreignKey: 'location',
      as: 'cityEvents',
    });
  };
  return City;
};
