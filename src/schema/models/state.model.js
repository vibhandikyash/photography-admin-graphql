const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class State extends Model { }

  State.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "state name", "fieldSpecification": "DropDown", "multipleSelection": false }',
    },
    countryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fipsCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    iso2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
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
        fields: ['country_id'],
      },
      {
        fields: ['country_code'],
      },
      {
        fields: ['name'],
      },
    ],
    sequelize,
    modelName: 'State',
    tableName: 'states',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });
  State.associate = models => {
    State.belongsTo(models.Country, {
      foreignKey: 'country_id',
      as: 'country',
    });
    State.hasMany(models.City, {
      foreignKey: 'state_id',
      as: 'cities',
    });
  };
  return State;
};
