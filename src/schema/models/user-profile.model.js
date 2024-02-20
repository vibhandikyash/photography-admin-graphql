/* eslint-disable max-len */
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserProfile extends Model { }

  UserProfile.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "Enter id", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '{ "sequence": 2, "block": "required", "placeHolder": "Enter user id", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '{ "sequence": 3, "block": "required", "placeHolder": "Enter bio", "fieldSpecification": "RichText", "multipleSelection": false }',
    },
    profilePhoto: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '{ "sequence": 4, "block": "optional", "placeHolder": "Upload profile photo", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    coverPhoto: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '{ "sequence": 5, "block": "optional", "placeHolder": "Upload cover photo", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    aadharCardFront: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '{ "sequence": 6, "block": "required", "placeHolder": "Upload aadhar-card front", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    aadharCardBack: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '{ "sequence": 7, "block": "required", "placeHolder": "Upload aadhar-card back", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    typeKey: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 8, "block": "required", "placeHolder": "Enter type id", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '{ "sequence": 10, "block": "optional", "placeHolder": "Is featured", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 9, "block": "optional", "placeHolder": "Enter created by", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 10, "block": "optional", "placeHolder": "Enter updated by", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    averageRating: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  }, {
    indexes: [
      {
        fields: ['aadhar_card_front'],
      },
      {
        fields: ['aadhar_card_back'],
      },
      {
        fields: ['type_key'],
      },
    ],
    sequelize,
    modelName: 'UserProfile',
    tableName: 'user_profiles',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  UserProfile.associate = models => {
    UserProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'userProfile', targetKey: 'id' });
    UserProfile.belongsTo(models.UserType, { foreignKey: 'typeKey', as: 'userType', targetKey: 'key' });
    UserProfile.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator', targetKey: 'id' });
    UserProfile.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'editor', targetKey: 'id' });
  };
  return UserProfile;
};
