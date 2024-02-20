const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FreelancerAttendanceLog extends Model { }

  FreelancerAttendanceLog.init({
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
    clockIn: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    clockOut: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    freelancerAttendanceId: {
      type: DataTypes.UUID,
      allowNull: false,
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
        fields: ['clock_in'],
      },
      {
        fields: ['clock_out'],
      },
    ],
    sequelize,
    modelName: 'FreelancerAttendanceLog',
    tableName: 'freelancer_attendance_logs',
    timeStamps: true,
    paranoid: true,
    underscored: true,
  });

  FreelancerAttendanceLog.associate = models => {
    FreelancerAttendanceLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user', targetKey: 'id' });
    FreelancerAttendanceLog.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event', targetKey: 'id' });
    FreelancerAttendanceLog.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'editor', targetKey: 'id' });
    FreelancerAttendanceLog.belongsTo(models.FreelancerAttendance,
      { foreignKey: 'freelancerAttendanceId', as: 'freelancerAttendance', targetKey: 'id' });
  };
  return FreelancerAttendanceLog;
};
