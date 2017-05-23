'use strict';
module.exports = function(sequelize, DataTypes) {
  var EmployeeMemo = sequelize.define('EmployeeMemo', {
    employee_id: DataTypes.INTEGER,
    memo: DataTypes.TEXT,
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
    tableName: "employee_memos"
  });
  return EmployeeMemo;
};