'use strict';
module.exports = function(sequelize, DataTypes) {
  var TimeFrame = sequelize.define('TimeFrame', {
    time_shift_id: DataTypes.INTEGER,
    fixed_in: DataTypes.TIME,
    fixed_out: DataTypes.TIME,
    flex_in_from: DataTypes.TIME,
    flex_in_to: DataTypes.TIME,
    flex_out_from: DataTypes.TIME,
    flex_out_to: DataTypes.TIME
  }, {
    classMethods: {
      associate: function(models) {
        TimeFrame.belongsTo(models.TimeShift, {
          foreignKey: "time_shift_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    timestamps: false,
    tableName: "time_frames"
  });
  return TimeFrame;
};