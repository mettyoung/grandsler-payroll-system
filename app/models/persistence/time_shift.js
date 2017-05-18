'use strict';
module.exports = function (sequelize, DataTypes)
{
  var TimeShift = sequelize.define('TimeShift', {
    salary_criterion_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function (models)
      {
        TimeShift.belongsTo(models.User, {
          as: "CreatedBy",
          foreignKey: "created_by",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        TimeShift.belongsTo(models.User, {
          as: "UpdatedBy",
          foreignKey: "updated_by",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        TimeShift.hasMany(models.Employee, {
          foreignKey: "time_shift_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        TimeShift.belongsTo(models.SALARY_CRITERION, {
          foreignKey: "salary_criterion_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        TimeShift.hasMany(models.TimeFrame, {
          foreignKey: "time_shift_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      },
      instanceMethods: {
        getWorkingHours() {
          return this.TimeFrames.reduce(function (accumulator, timeFrame)
          {
            return accumulator + (timeFrame.getFixedOut() - timeFrame.getFixedIn()) * 1000 * 60 * 60;
          }, 0);
        }
      },
      tableName: "time_shifts"
    }
  });
  return TimeShift;
};