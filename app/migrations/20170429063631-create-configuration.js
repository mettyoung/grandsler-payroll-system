'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('configurations', {
        particular: {
          type: Sequelize.STRING,
          allowNull: false,
          primaryKey: true
        },
        value: Sequelize.STRING
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('configurations');
  }
};