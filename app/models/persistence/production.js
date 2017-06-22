'use strict';
module.exports = function(sequelize, DataTypes) {
  var Production = sequelize.define('Production', {
    stock_code_id: DataTypes.INTEGER,
    color_id: DataTypes.INTEGER,
    size_id: DataTypes.INTEGER,
    is_finished: DataTypes.BOOLEAN,
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

        Production.belongsTo(models.StockCode, {
          foreignKey: "stock_code_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        Production.belongsTo(models.Color, {
          foreignKey: "color_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        Production.belongsTo(models.Size, {
          foreignKey: "size_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    tableName: 'productions'
  });
  return Production;
};