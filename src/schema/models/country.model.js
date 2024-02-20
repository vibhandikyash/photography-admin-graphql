const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Country extends Model { }
  Country.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "country name", "fieldSpecification": "DropDown", "multipleSelection": false }',
    },
    iso3: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numericCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    iso2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    capital: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currencyName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currencySymbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tld: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    native: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subregion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timezones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    translations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    emoji: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    emojiU: {
      type: DataTypes.STRING,
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
  }, {
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['numeric_code'],
      },
      {
        fields: ['phone_code'],
      },
    ],
    sequelize,
    timeStamps: true,
    modelName: 'Country',
    tableName: 'countries',
    paranoid: true,
    underscored: true,
  });

  Country.associate = models => {
    Country.hasMany(models.State, {
      foreignKey: 'country_id',
      as: 'state',
    });
    Country.hasMany(models.City, {
      foreignKey: 'country_id',
      as: 'cities',
    });
  };

  return Country;
};
