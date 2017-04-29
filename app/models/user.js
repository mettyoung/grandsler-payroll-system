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
      }
    },
    tableName: "users"
  });
  return User;
};