'use strict';
module.exports = function(sequelize, DataTypes) {
  var ProductionLine = sequelize.define('ProductionLine', {
    parent_id: DataTypes.INTEGER,
    production_id: DataTypes.INTEGER,
    stock_code_id: DataTypes.INTEGER,
    pipeline_id: DataTypes.INTEGER,
    operation_id: DataTypes.INTEGER,
    operation_number: DataTypes.INTEGER,
    employee_id: DataTypes.INTEGER,
    date_finished: DataTypes.DATE,
    dozen_quantity: DataTypes.INTEGER,
    piece_quantity: DataTypes.INTEGER,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        ProductionLine.belongsTo(models.Production, {
          foreignKey: "production_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
        
        ProductionLine.belongsTo(models.Employee, {
          foreignKey: "employee_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        ProductionLine.hasMany(models.ProductionLine, {
          as: "ChildrenProductionLines",
          foreignKey: "parent_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    tableName: 'production_lines'
  });
  return ProductionLine;
};