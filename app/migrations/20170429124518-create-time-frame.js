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
      main_in: {
        allowNull: false,
        type: Sequelize.TIME
      },
      secondary_in: {
        type: Sequelize.TIME
      },
      main_out: {
        allowNull: false,
        type: Sequelize.TIME
      },
      secondary_out: {
        type: Sequelize.TIME
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('time_frames');
  }
};