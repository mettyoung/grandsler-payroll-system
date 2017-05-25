'use strict';

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    is_enabled: DataTypes.BOOLEAN,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {

        User.hasOne(models.Employee, {
          foreignKey: "user_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        User.belongsTo(models.User, {
          as: "UpdatedBy",
          foreignKey: "updated_by",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        User.hasMany(models.UserPermission, {
          foreignKey: "user_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    instanceMethods: {
      hasPermission(moduleName)
      {
        return this.UserPermissions.filter(userPermission => userPermission.module_name === moduleName).length > 0;
      }
    },
    tableName: "users"
  });
  return User;
};