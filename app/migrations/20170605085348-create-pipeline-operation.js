'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('pipelines_operations', {
      pipeline_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'pipelines',
          key: 'id'
        },
        primaryKey: 'composite'
      },
      operation_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'operations',
          key: 'id'
        },
        primaryKey: 'composite'
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('pipelines_operations');
  }
};