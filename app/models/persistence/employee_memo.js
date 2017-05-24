'use strict';
const moment = require('moment');

module.exports = function(sequelize, DataTypes) {
  var EmployeeMemo = sequelize.define('EmployeeMemo', {
    employee_id: DataTypes.INTEGER,
    description: DataTypes.TEXT,
    created_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        EmployeeMemo.belongsTo(models.Employee, {
          foreignKey: "employee_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        EmployeeMemo.belongsTo(models.User, {
          as: "CreatedBy",
          foreignKey: "created_by",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    instanceMethods: {
      getCreatedDate() {
        return moment(this.created_at).format('MMMM Do YYYY, h:mm a');
      }
    },
    tableName: "employee_memos",
    updatedAt: false
  });
  return EmployeeMemo;
};