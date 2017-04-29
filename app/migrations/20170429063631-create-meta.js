'use strict';
module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable('meta', {
        particular: {
          type: Sequelize.STRING,
          allowNull: false,
          primaryKey: true
        },
        value: Sequelize.STRING
    });
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable('meta');
  }
};