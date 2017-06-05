'use strict';
module.exports = function(sequelize, DataTypes) {
  var Pipeline = sequelize.define('Pipeline', {
    name: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {

        Pipeline.hasMany(models.Operation, {
          foreignKey: "pipeline_id",
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    tableName: "pipelines"
  });
  return Pipeline;
};