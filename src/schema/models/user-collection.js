const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserCollection extends Model { }

  UserCollection.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "enter category", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    type: {
      type: DataTypes.ENUM('IMAGE', 'VIDEO'),
      defaultValue: 'IMAGE',
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
  }, {
    indexes: [
      {
        fields: ['name'],
      },
    ],
    sequelize,
    modelName: 'UserCollection',
    tableName: 'user_collections',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  UserCollection.associate = models => {
    UserCollection.hasMany(models.UserCollectionAsset, { foreignKey: 'collectionId', as: 'collectionAssets', targetKey: 'id' });
    UserCollection.belongsTo(models.User, { foreignKey: 'userId', as: 'userCollection', targetKey: 'id' });
    UserCollection.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator', targetKey: 'id' });
    UserCollection.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'editor', targetKey: 'id' });
  };
  return UserCollection;
};
