/* eslint-disable max-lines */
/* eslint-disable max-len */
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model { }
  User.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      comment: '{ "sequence": 1, "block": "required", "placeHolder": "Enter id", "fieldSpecification": "Name", "multipleSelection": false}',
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 2, "block": "optional", "placeHolder": "Enter full name", "fieldSpecification": "Name", "multipleSelection": false, "label":"Full Name"}',
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 3, "block": "required", "placeHolder": "Enter user-name", "fieldSpecification": "Name", "multipleSelection": false, "label": "User name"}',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true },
      unique: true,
      comment: '{ "sequence": 4, "block": "required", "placeHolder": "Enter email", "fieldSpecification": "Name", "multipleSelection": false, "label":"Email" }',
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '{ "sequence": 5, "block": "required", "placeHolder": "Is verified", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    verificationStatus: {
      type: DataTypes.ENUM('APPROVED', 'PENDING', 'REJECTED'),
      defaultValue: 'PENDING',
      comment: '{ "sequence": 6, "block": "required", "placeHolder": "verification status", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    contactNo: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '{ "sequence": 7, "block": "required", "placeHolder": "Enter contact no", "fieldSpecification": "Name", "multipleSelection": false, "label":"Contact No"}',
    },
    countryCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 8, "block": "optional", "placeHolder": "Enter password", "fieldSpecification": "Name", "multipleSelection": false, "label":"Password" }',
    },
    role: {
      type: DataTypes.ENUM('SUPER_ADMIN', 'ADMIN', 'WEDLANCER_COORDINATOR', 'SALES', 'MARKETING', 'FINANCE', 'DISPUTE_MANAGER', 'FREELANCER', 'RECRUITER'),
      defaultValue: 'FREELANCER',
      comment: '{ "sequence": 9, "block": "required", "placeHolder": "Enter role", "fieldSpecification": "DropDown", "multipleSelection": false }',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '{ "sequence": 11, "block": "required", "placeHolder": "Is active", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '{ "sequence": 12, "block": "optional", "placeHolder": "Enter refreshToken", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    otp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '{ "sequence": 13, "block": "optional", "placeHolder": "Enter otp", "fieldSpecification": "Number", "multipleSelection": false }',
    },
    otpExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '{ "sequence": 14, "block": "optional", "placeHolder": "Enter otp expiry", "fieldSpecification": "DATE", "multipleSelection": false }',
    },
    otpRequestAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '{ "sequence": 15, "block": "optional", "placeHolder": "OTP request attempts", "fieldSpecification": "Number", "multipleSelection": false }',
    },
    otpWrongAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '{ "sequence": 16 "block": "optional", "placeHolder": "wrong otp attempts", "fieldSpecification": "Number", "multipleSelection": false }',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 17, "block": "optional", "placeHolder": "created by", "fieldSpecification": "Name", "multipleSelection":false }',
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: '{ "sequence": 18, "block": "optional", "placeHolder": "updated by", "fieldSpecification": "Name", "multipleSelection": false }',
    },
    timeZone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'Asia/Kolkata',
    },
    accountDeletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    indexes: [
      {
        fields: ['email'],
      },
      {
        fields: ['refresh_token'],
      },
      {
        fields: ['role'],
      },
      {
        fields: ['user_name'],
      },
      {
        fields: ['verification_status'],
      },
    ],
    sequelize,
    timeStamps: true,
    modelName: 'User',
    tableName: 'users',
    paranoid: true,
    underscored: true,
  });
  User.associate = models => {
    User.hasMany(models.AccessToken, { foreignKey: 'userId', as: 'token', targetKey: 'id' });
    User.hasMany(models.UserCollection, { foreignKey: 'userId', as: 'collection', targetKey: 'id' });
    User.hasMany(models.UserCollectionAsset, { foreignKey: 'userId', as: 'collectionAssets', targetKey: 'id' });
    User.hasMany(models.UserBadge, { foreignKey: 'userId', as: 'badge', sourceKey: 'id' });
    User.hasMany(models.User, { foreignKey: 'createdBy', as: 'creator', targetKey: 'id' });
    User.hasMany(models.User, { foreignKey: 'updatedBy', as: 'editor', targetKey: 'id' });
    User.hasMany(models.UserBadge, { foreignKey: 'assignedBy', as: 'badgeAssignee', sourceKey: 'id' });
    User.hasMany(models.UserCollection, { foreignKey: 'updatedBy', as: 'collectionEditor', targetKey: 'id' });
    User.hasMany(models.UserCollection, { foreignKey: 'createdBy', as: 'collectionCreator', targetKey: 'id' });
    User.hasOne(models.UserProfile, { foreignKey: 'userId', as: 'profile', targetKey: 'id' });
    User.hasOne(models.UserBusiness, { foreignKey: 'userId', as: 'business', targetKey: 'id' });
    User.hasMany(models.Comment, { foreignKey: 'senderId', as: 'senderComments', targetKey: 'id' });
    User.hasMany(models.Comment, { foreignKey: 'receiverId', as: 'receiverComments', targetKey: 'id' });
    User.hasMany(models.EventFreelancer, { foreignKey: 'userId', as: 'eventFreelancer', targetKey: 'id' });
    User.hasMany(models.FreelancerAttendance, { foreignKey: 'userId', as: 'attendance', targetKey: 'id' });
    User.hasMany(models.FreelancerCalender, { foreignKey: 'userId', as: 'freelancerCalender', targetKey: 'id' });
    User.hasMany(models.Dispute, { foreignKey: 'userId', as: 'userIssues', targetKey: 'id' });
    User.hasMany(models.Transaction, { foreignKey: 'userId', as: 'transactions', targetKey: 'id' });
    User.hasMany(models.Transaction, { foreignKey: 'freelancerId', as: 'freelancerTransaction', targetKey: 'id' });
    User.hasMany(models.UserReview, { foreignKey: 'userId', as: 'reviewFor', targetKey: 'id' });
    User.hasMany(models.Event, { foreignKey: 'createdBy', as: 'eventCreator', targetKey: 'id' });
    User.hasMany(models.Event, { foreignKey: 'assignedTo', as: 'eventAssigned', targetKey: 'id' });
    User.hasMany(models.Event, { foreignKey: 'cancelledBy', as: 'eventCancel', targetKey: 'id' });
    User.hasMany(models.Event, { foreignKey: 'updatedBy', as: 'eventEditor', targetKey: 'id' });
    User.hasMany(models.Event, { foreignKey: 'recruiterId', as: 'recruiterEvent', targetKey: 'id' });
    User.hasMany(models.FreelancerAttendance, { foreignKey: 'updatedBy', as: 'attendanceEditor', targetKey: 'id' });
    User.hasMany(models.FreelancerAttendanceLog, { foreignKey: 'updatedBy', as: 'attendanceLogEditor', targetKey: 'id' });
    User.hasMany(models.FreelancerAttendanceLog, { foreignKey: 'userId', as: 'freelancerAttendance', targetKey: 'id' });
    User.hasMany(models.FreelancerCalender, { foreignKey: 'updatedBy', as: 'calenderEditor', targetKey: 'id' });
    User.hasMany(models.Dispute, { foreignKey: 'raisedBy', as: 'issueCreator', targetKey: 'id' });
    User.hasMany(models.UserReview, { foreignKey: 'reviewerId', as: 'reviewCreator', targetKey: 'id' });
    User.hasMany(models.RegularizeRequest, { foreignKey: 'userId', as: 'regularizeRequests', targetKey: 'id' });
  };
  return User;
};
