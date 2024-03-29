'use strict';
module.exports = function(sequelize, DataTypes) {
  var StockCodeOperation = sequelize.define('StockCodeOperation', {
    stock_code_id: DataTypes.INTEGER,
    pipeline_id: DataTypes.INTEGER,
    operation_id: DataTypes.INTEGER,
    order: DataTypes.INTEGER,
    price: DataTypes.DECIMAL(10,2)
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    },
    tableName: 'stock_codes_operations',
    createdAt: false,
    updatedAt: false
  });
  return StockCodeOperation;
};