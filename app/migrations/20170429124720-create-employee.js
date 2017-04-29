'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('employees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      position_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'positions',
          key: 'id'
        }
      },
      time_shift_id: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'time_shifts',
          key: 'id'
        }
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      employee_type: {
        allowNull: false,
        type: Sequelize.ENUM('Time-based', 'Output-based')
      },
      picture: {
        type: Sequelize.BLOB
      },
      last_name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      middle_name: {
        type: Sequelize.STRING
      },
      first_name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      gender: {
        allowNull: false,
        type: Sequelize.ENUM('Male', 'Female')
      },
      birthday: {
        type: Sequelize.DATEONLY
      },
      address: {
        type: Sequelize.TEXT
      },
      contact_number: {
        type: Sequelize.STRING
      },
      created_by: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      updated_by: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('employees');
  }
};