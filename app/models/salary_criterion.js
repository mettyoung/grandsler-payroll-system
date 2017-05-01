'use strict';
module.exports = function(sequelize, DataTypes) {
  var SALARY_CRITERION = sequelize.define('SALARY_CRITERION', {
    name: DataTypes.STRING,
    minimum_minutes: DataTypes.INTEGER,
    mark_up: DataTypes.DECIMAL(10, 2),
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        SALARY_CRITERION.belongsTo(models.User, {
          as: "UpdatedBy",
          foreignKey: "updated_by",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        SALARY_CRITERION.hasMany(models.TimeShift, {
          foreignKey: "salary_criterion_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    tableName: "SALARY_CRITERIA",
    createdAt: false
  });
  return SALARY_CRITERION;
};