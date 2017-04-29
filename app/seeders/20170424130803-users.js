'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('users', [{
      "id": 1,
      "username": "admin",
      "password": "admin",
      "is_enabled": true,
      "created_at": queryInterface.sequelize.fn('NOW'),
      "updated_at": queryInterface.sequelize.fn('NOW'),
      "updated_by": 1
   }]);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', {"username": "admin"});
  }
};
