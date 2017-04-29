'use strict';
module.exports = function(sequelize, DataTypes) {
  var Configuration = sequelize.define('Configuration', {
    particular: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    value: DataTypes.STRING
  }, {
    timestamps: false,
    tableName: 'configurations'
  });
  return Configuration;
};