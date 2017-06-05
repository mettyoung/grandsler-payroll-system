'use strict';
module.exports = function(sequelize, DataTypes) {
  var Size = sequelize.define('Size', {
    name: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    },
    tableName: "sizes"
  });
  return Size;
};