'use strict';
module.exports = function (sequelize, DataTypes) {
  var UserLog = sequelize.define('user_logs', {
    user_id: DataTypes.INTEGER,
    module: DataTypes.STRING,
    description: DataTypes.TEXT
  }, {
    classMethods: {
      associate: function (models) {
        UserLog.belongsTo(models.User, {
          foreignKey: "user_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    updatedAt: false
  });
  return UserLog;
};