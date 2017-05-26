'use strict';
module.exports = function(sequelize, DataTypes) {
  var Employee = sequelize.define('Employee', {
    position_id: DataTypes.INTEGER,
    time_shift_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    employee_type: DataTypes.ENUM('Time-based', 'Output-based'),
    picture: DataTypes.BLOB('long'),
    last_name: DataTypes.STRING,
    middle_name: DataTypes.STRING,
    first_name: DataTypes.STRING,
    gender: DataTypes.ENUM('Male', 'Female'),
    birthday: DataTypes.DATEONLY,
    address: DataTypes.TEXT,
    contact_number: DataTypes.STRING,
    day_rate: DataTypes.DECIMAL,
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

        Employee.hasMany(models.Employment, {
          foreignKey: "employee_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    instanceMethods: {

      /**
       * Gets the last name, first name.
       * @returns {string}
       */
      getFullName() 
      {
        return this.last_name + ", " + this.first_name;  
      },
      
      /**
       * Returns a formatted string if the employee has access to the system. (e.g. The Employee instance must include
       * User in the query.
       * @returns {string}
       */
      hasSystemAccess()
      {
        return this.User? 'Yes': 'No';
      }
    },
    tableName: "employees"
  });
  return Employee;
};