'use strict';
module.exports = function(sequelize, DataTypes) {
  var Pipeline = sequelize.define('Pipeline', {
    name: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    updated_by: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {

        Pipeline.belongsToMany(models.Operation, {
          through: models.PipelineOperation,
          foreignKey: "pipeline_id",
          otherKey: 'operation_id',
          onDelete: 'RESTRICT',
          onUpdate: 'RESTRICT'
        });
      }
    },
    tableName: "pipelines"
  });
  return Pipeline;
};