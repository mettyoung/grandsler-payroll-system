'use strict';
module.exports = function(sequelize, DataTypes) {
  var TimeFrame = sequelize.define('TimeFrame', {
    time_shift_id: DataTypes.INTEGER,
    main_in: DataTypes.TIME,
    secondary_in: DataTypes.TIME,
    main_out: DataTypes.TIME,
    secondary_out: DataTypes.TIME
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