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
        }
      },
      operation_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'operations',
          key: 'id'
        }
      },
      price: {
        allowNull: false,
        type: Sequelize.DECIMAL(10,2)
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('stock_codes_operations');
  }
};