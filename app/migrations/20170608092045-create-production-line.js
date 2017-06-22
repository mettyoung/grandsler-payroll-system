'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('production_lines', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      parent_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'production_lines',
          key: 'id'
        }
      },
      production_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'productions',
          key: 'id'
        }
      },
      stock_code_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      pipeline_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      operation_id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      operation_number: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      employee_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'employees',
          key: 'id'
        }
      },
      date_finished: {
        allowNull: false,
        type: Sequelize.DATE
      },
      dozen_quantity: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      piece_quantity: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('production_lines');
  }
};