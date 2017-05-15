'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('time_frames', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      time_shift_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'time_shifts',
          key: 'id'
        }
      },
      fixed_in_index: {
        allowNull: false,
        type: Sequelize.STRING
      },
      fixed_out_index: {
        allowNull: false,
        type: Sequelize.STRING
      },
      flex_in_from: {
        allowNull: false,
        type: Sequelize.DATE
      },
      flex_in_to: {
        allowNull: false,
        type: Sequelize.DATE
      },
      flex_out_from: {
        allowNull: false,
        type: Sequelize.DATE
      },
      flex_out_to: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('time_frames');
  }
};