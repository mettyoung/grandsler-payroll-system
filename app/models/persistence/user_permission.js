'use strict';
module.exports = function(sequelize, DataTypes) {
  var UserPermission = sequelize.define('UserPermission', {
    user_id: DataTypes.INTEGER,
    module_name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    },
    tableName: 'user_permissions',
    updatedAt: false
  });
  return UserPermission;
};