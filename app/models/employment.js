'use strict';
module.exports = function(sequelize, DataTypes) {
  var Employment = sequelize.define('Employment', {
    employee_id: DataTypes.INTEGER,
    date_hired: DataTypes.DATEONLY,
    date_released: DataTypes.DATEONLY,
    memo: DataTypes.TEXT,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        Employment.belongsTo(models.Employee, {
          foreignKey: "employee_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        Employment.belongsTo(models.User, {
          as: "CreatedBy",
          foreignKey: "created_by",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        Employment.belongsTo(models.User, {
          as: "UpdatedBy",
          foreignKey: "updated_by",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    tableName: "employments"
  });
  return Employment;
};