'use strict';
module.exports = function(sequelize, DataTypes) {
  var Production = sequelize.define('Production', {
    stock_code_id: DataTypes.INTEGER,
    color_id: DataTypes.INTEGER,
    size_id: DataTypes.INTEGER,
    employee_id: DataTypes.INTEGER,
    dozen_quantity: DataTypes.INTEGER,
    piece_quantity: DataTypes.INTEGER,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        Production.hasMany(models.ProductionLine, {
          foreignKey: "production_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    tableName: 'productions'
  });
  return Production;
};