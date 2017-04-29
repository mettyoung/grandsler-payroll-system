'use strict';
module.exports = function(sequelize, DataTypes) {
  var Employee = sequelize.define('Employee', {
    position_id: DataTypes.INTEGER,
    time_shift_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    employee_type: DataTypes.ENUM('Time-based', 'Output-based'),
    picture: DataTypes.BLOB,
    last_name: DataTypes.STRING,
    middle_name: DataTypes.STRING,
    first_name: DataTypes.STRING,
    gender: DataTypes.ENUM('Male', 'Female'),
    birthday: DataTypes.DATEONLY,
    address: DataTypes.TEXT,
    contact_number: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        Employee.belongsTo(models.Position, {
          foreignKey: "position_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        Employee.belongsTo(models.TimeShift, {
          foreignKey: "time_shift_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        Employee.belongsTo(models.User, {
          foreignKey: "user_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        Employee.belongsTo(models.User, {
          as: "CreatedBy",
          foreignKey: "created_by",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        Employee.belongsTo(models.User, {
          as: "UpdatedBy",
          foreignKey: "updated_by",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    tableName: "employees"
  });
  return Employee;
};