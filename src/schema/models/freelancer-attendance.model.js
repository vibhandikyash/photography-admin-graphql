const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FreelancerAttendance extends Model { }

  FreelancerAttendance.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    eventTimingsId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstClockIn: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastClockOut: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isManual: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    indexes: [
      {
        fields: ['event_id'],
      },
      {
        fields: ['otp'],
      },
    ],
    sequelize,
    modelName: 'FreelancerAttendance',
    tableName: 'freelancer_attendances',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  FreelancerAttendance.associate = models => {
    FreelancerAttendance.belongsTo(models.User, { foreignKey: 'userId', as: 'user', targetKey: 'id' });
    FreelancerAttendance.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event', targetKey: 'id' });
    FreelancerAttendance.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'editor', targetKey: 'id' });
    FreelancerAttendance.belongsTo(models.EventTiming, { foreignKey: 'eventTimingsId', as: 'eventTimings', targetKey: 'id' });
    FreelancerAttendance.hasMany(models.FreelancerAttendanceLog, { foreignKey: 'freelancerAttendanceId', as: 'attendanceLog', targetKey: 'id' });
  };
  return FreelancerAttendance;
};
