'use strict';
module.exports = function(sequelize, DataTypes) {
  var Operation = sequelize.define('Operation', {
    name: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {

        Operation.belongsToMany(models.Pipeline, {
          through: models.PipelineOperation,
          foreignKey: 'operation_id',
          otherKey: "pipeline_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        Operation.belongsToMany(models.StockCode, {
          through: models.StockCodeOperation,
          foreignKey: 'operation_id',
          otherKey: 'stock_code_id',
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    tableName: "operations"
  });
  return Operation;
};