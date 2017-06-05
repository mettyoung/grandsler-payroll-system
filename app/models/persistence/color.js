'use strict';
module.exports = function(sequelize, DataTypes) {
  var Color = sequelize.define('Color', {
    name: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    },
    tableName: "colors"
  });
  return Color;
};