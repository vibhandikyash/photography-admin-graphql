const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model { }

  Category.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "id", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      comment: '{ "sequence": 2, "block": "required", "placeHolder": "category name", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 3, "block": "required", "placeHolder": "category url", "fieldSpecification": "Url", "multipleSelection": false }',
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '{ "sequence": 4, "placeHolder": "order", "fieldSpecification": "Order", "multipleSelection": false }',
      defaultValue: 99,
    },
  }, {
    indexes: [
      {
        fields: ['name'],
      },
    ],
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });
  Category.associate = models => {
    Category.hasMany(models.UserBusiness, { foreignKey: 'categoryId', as: 'userCategory', targetKey: 'id' });
  };
  return Category;
};
