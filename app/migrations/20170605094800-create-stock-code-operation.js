'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('stock_codes_operations', {
      stock_code_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'stock_codes',
          key: 'id'
        },
        primaryKey: 'composite'
      },
      pipeline_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        primaryKey: 'composite'
      },
      operation_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        primaryKey: 'composite'
      },
      order: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      price: {
        allowNull: false,
        type: Sequelize.DECIMAL(10,2)
      }
    }).then(() => queryInterface.addIndex('stock_codes_operations', ['order']));
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('stock_codes_operations');
  }
};