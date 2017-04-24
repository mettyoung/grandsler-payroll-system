'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('users', [{
      "username": "admin",
      "password": "admin",
      "created_at": queryInterface.sequelize.fn('NOW'),
      "updated_at": queryInterface.sequelize.fn('NOW')
   }]);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', {"username": "admin"});
  }
};
