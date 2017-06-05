'use strict';
module.exports = function(sequelize, DataTypes) {
  var PipelineOperation = sequelize.define('PipelineOperation', {
    pipeline_id: DataTypes.INTEGER,
    operation_id: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return PipelineOperation;
};