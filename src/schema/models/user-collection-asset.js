const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserCollectionAsset extends Model { }

  UserCollectionAsset.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    collectionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 2, "block": "required", "placeHolder": "enter title", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: false,
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '{ "sequence": 3, "block": "required", "placeHolder": "Is featured", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 4, "block": "optional", "placeHolder": "enter created by", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 5, "block": "optional", "placeHolder": "enter updated by", "fieldSpecification": "Name", "multipleSelection": false }',
    },
  }, {
    indexes: [
      {
        fields: ['is_featured'],
      },
      {
        fields: ['collection_id'],
      },
      {
        fields: ['url'],
      },
    ],
    sequelize,
    modelName: 'UserCollectionAsset',
    tableName: 'user_collection_assets',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  UserCollectionAsset.associate = models => {
    UserCollectionAsset.belongsTo(models.User, { foreignKey: 'userId', as: 'userCollection', targetKey: 'id' });
    UserCollectionAsset.belongsTo(models.UserCollection, {
      foreignKey: { name: 'collectionId', allowNull: true }, as: 'collectionAssets', targetKey: 'id',
    });
    UserCollectionAsset.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator', targetKey: 'id' });
    UserCollectionAsset.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'editor', targetKey: 'id' });
  };
  return UserCollectionAsset;
};
