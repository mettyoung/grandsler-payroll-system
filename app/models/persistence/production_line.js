'use strict';
module.exports = function(sequelize, DataTypes) {
  var ProductionLine = sequelize.define('ProductionLine', {
    parent_id: DataTypes.INTEGER,
    production_id: DataTypes.INTEGER,
    stock_code_id: DataTypes.INTEGER,
    pipeline_id: DataTypes.INTEGER,
    operation_id: DataTypes.INTEGER,
    employee_id: DataTypes.INTEGER,
    date_finished: DataTypes.DATE,
    dozen_quantity: DataTypes.INTEGER,
    piece_quantity: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        ProductionLine.belongsTo(models.ProductionLine, {
          foreignKey: "parent_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
        
        ProductionLine.belongsTo(models.Employee, {
          foreignKey: "employee_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    tableName: 'production_lines',
    createdAt: false,
    updatedAt: false
  });
  return ProductionLine;
};