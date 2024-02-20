const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UpfrontCategoryRequirement extends Model { }

  UpfrontCategoryRequirement.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    categoryType: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    pricePerDay: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    indexes: [
      {
        fields: ['category_type'],
      },
      {
        fields: ['price_per_day'],
      },
    ],
    sequelize,
    modelName: 'UpfrontCategoryRequirement',
    tableName: 'upfront_category_requirements',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  UpfrontCategoryRequirement.associate = models => {
    UpfrontCategoryRequirement.hasMany(models.EventFreelancer, { foreignKey: 'eventCategoryId', as: 'freelancers', targetKey: 'id' });
    UpfrontCategoryRequirement.belongsTo(models.Category, { foreignKey: 'categoryType', as: 'eventCategory', targetKey: 'id' });
    UpfrontCategoryRequirement.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event', targetKey: 'id' });
  };
  return UpfrontCategoryRequirement;
};
