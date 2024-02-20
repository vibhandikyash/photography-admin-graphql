const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Event extends Model { }

  Event.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "Event name", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    recruiterId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    location: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    totalBudget: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    leadType: {
      type: DataTypes.ENUM('UPFRONT', 'ORGANIC'),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ONGOING', 'UPCOMING', 'COMPLETED', 'CANCELLED'),
      defaultValue: 'UPCOMING',
    },
    assignedTo: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    isAssigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancelledBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    timeZone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Asia/Kolkata',
    },
    isInsufficientHoursChecked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['start_date'],
      },
      {
        fields: ['end_date'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['lead_type'],
      },
    ],
    sequelize,
    modelName: 'Event',
    tableName: 'events',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });
  Event.associate = models => {
    Event.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator', targetKey: 'id' });
    Event.belongsTo(models.User, { foreignKey: 'assignedTo', as: 'assignee', targetKey: 'id' });
    Event.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'editor', targetKey: 'id' });
    Event.belongsTo(models.User, { foreignKey: 'cancelledBy', as: 'cancelledByUser', targetKey: 'id' });
    Event.belongsTo(models.User, { foreignKey: 'recruiterId', as: 'recruiter', targetKey: 'id' });
    Event.belongsTo(models.City, { foreignKey: 'location', as: 'cities', targetKey: 'id' });
    Event.hasMany(models.Comment, { foreignKey: 'eventId', as: 'comments', targetKey: 'id' });
    Event.hasMany(models.UserReview, { foreignKey: 'eventId', as: 'reviews', targetKey: 'id' });
    Event.hasMany(models.UpfrontCategoryRequirement, { foreignKey: 'eventId', as: 'categories', targetKey: 'id' });
    Event.hasMany(models.EventFreelancer, { foreignKey: 'eventId', as: 'freelancers', targetKey: 'id' });
    Event.hasMany(models.FreelancerAttendance, { foreignKey: 'eventId', as: 'freelancerAttendance', targetKey: 'id' });
    Event.hasMany(models.FreelancerAttendanceLog, { foreignKey: 'eventId', as: 'attendanceLog', targetKey: 'id' });
    Event.hasMany(models.FreelancerCalender, { foreignKey: 'eventId', as: 'freelancerCalender', targetKey: 'id' });
    Event.hasMany(models.Dispute, { foreignKey: 'eventId', as: 'eventIssue', targetKey: 'id' });
    Event.hasMany(models.Transaction, { foreignKey: 'eventId', as: 'transactions', targetKey: 'id' });
    Event.hasMany(models.EventTiming, { foreignKey: 'eventId', as: 'timings', targetKey: 'id' });
    Event.hasMany(models.RegularizeRequest, { foreignKey: 'eventId', as: 'regularizeRequests', targetKey: 'id' });
    Event.hasMany(models.Invoice, { foreignKey: 'eventId', as: 'invoices', targetKey: 'id' });
  };
  return Event;
};
