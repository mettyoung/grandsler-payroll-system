'use strict';
module.exports = function(sequelize, DataTypes) {
  var StockCode = sequelize.define('StockCode', {
    pipeline_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        StockCode.belongsToMany(models.Operation, {
          through: models.StockCodeOperation,
          foreignKey: 'stock_code_id',
          otherKey: 'operation_id',
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        StockCode.hasMany(models.StockCodeOperation, {
          foreignKey: 'stock_code_id',
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    tableName: 'stock_codes'
  });
  return StockCode;
};