'use strict';
module.exports = function(sequelize, DataTypes) {
  var Position =  sequelize.define('Position', {
    name: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        Position.hasMany(models.Employee, {
          foreignKey: "position_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        Position.belongsTo(models.User, {
          as: "CreatedBy",
          foreignKey: "created_by",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });

        Position.belongsTo(models.User, {
          as: "UpdatedBy",
          foreignKey: "updated_by",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    tableName: 'positions'
  });
  return Position;
};