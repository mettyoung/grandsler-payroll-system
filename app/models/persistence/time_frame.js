'use strict';
module.exports = function (sequelize, DataTypes)
{
  var TimeFrame = sequelize.define('TimeFrame', {
    time_shift_id: DataTypes.INTEGER,
    fixed_in_index: DataTypes.STRING,
    fixed_out_index: DataTypes.STRING,
    flex_in_from: DataTypes.DATE,
    flex_in_to: DataTypes.DATE,
    flex_out_from: DataTypes.DATE,
    flex_out_to: DataTypes.DATE
  }, {
    classMethods: {
      associate: function (models)
      {
        TimeFrame.belongsTo(models.TimeShift, {
          foreignKey: "time_shift_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    instanceMethods: {
      getFixedIn() {
        return this[this.fixed_in_index];
      },
      getFixedOut() {
        return this[this.fixed_out_index];
      }
    },
    timestamps: false,
    tableName: "time_frames"
  });
  return TimeFrame;
};