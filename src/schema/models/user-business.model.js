const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserBusiness extends Model { }

  UserBusiness.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "id", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '{ "sequence": 2, "block": "required", "placeHolder": "user id", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    projectsComplete: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '{"sequence": 3, "block": "required", "placeHolder": "projectsComplete", "fieldSpecification": "Number", "multipleSelection": false }',
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 4, "block": "optional", "placeHolder": "company name", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    tagLine: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '{ "sequence": 5, "block": "optional", "placeHolder": "tag line", "fieldSpecification": "RichText", "multipleSelection": false }',
    },
    pricePerDay: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: '{ "sequence": 6, "block": "required", "placeHolder": "price per day", "fieldSpecification": "Number", "multipleSelection": false }',
    },
    primaryLocation: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 7, "block": "required", "placeHolder": "Primary location", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    secondaryLocation: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 8,"block":"optional", "placeHolder": "Secondary location", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    accomplishments: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '{ "sequence": 9,"block":"optional", "placeHolder": "Accomplishments", "fieldSpecification": "RichText", "multipleSelection": false }',
    },
    equipmentList: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '{ "sequence": 10, "block": "optional", "placeHolder": "Equipments", "fieldSpecification": "RichText", "multipleSelection": false }',
    },
    instagramLink: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 11, "block": "optional", "placeHolder": "Instagram link", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 12, "block": "required", "placeHolder": "category id", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    addressLine1: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 13, "block": "optional", "placeHolder": "address line 1", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    addressLine2: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 14, "block": "optional", "placeHolder": "address line 2", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    city: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 15, "block": "optional", "placeHolder": "enter city", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    state: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 16, "block": "optional", "placeHolder": "enter state", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    country: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 17, "block": "required", "placeHolder": "enter country", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 18, "block": "required", "placeHolder": "enter zip code", "fieldSpecification": "Number", "multipleSelection": false }',
    },
    totalBalance: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 19, "block": "optional", "placeHolder": "created by", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 20, "block": "optional", "placeHolder": "updated by", "fieldSpecification": "Name", "multipleSelection": false }',
    },
  }, {
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['primary_location'],
      },
      {
        fields: ['secondary_location'],
      },
    ],
    sequelize,
    modelName: 'UserBusiness',
    tableName: 'user_businesses',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  UserBusiness.associate = models => {
    UserBusiness.belongsTo(models.User, { foreignKey: 'userId', as: 'userBusiness', targetKey: 'id' });
    UserBusiness.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'userCategory', targetKey: 'id' });
    UserBusiness.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator', targetKey: 'id' });
    UserBusiness.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'editor', targetKey: 'id' });
    UserBusiness.belongsTo(models.City, { foreignKey: 'primaryLocation', as: 'userPrimaryLocation', targetKey: 'id' });
    UserBusiness.belongsTo(models.City, { foreignKey: 'secondaryLocation', as: 'userSecondaryLocation', targetKey: 'id' });
    UserBusiness.belongsTo(models.City, { foreignKey: 'city', as: 'userCity', targetKey: 'id' });
    UserBusiness.belongsTo(models.State, { foreignKey: 'state', as: 'userState', targetKey: 'id' });
    UserBusiness.belongsTo(models.Country, { foreignKey: 'country', as: 'userCountry', targetKey: 'id' });
  };
  return UserBusiness;
};
