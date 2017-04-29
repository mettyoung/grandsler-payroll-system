'use strict';
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Meta', {
    particular: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    value: DataTypes.STRING
  }, {
    timestamps: false,
    tableName: 'meta'
  });
};