'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('meta', [{
      "particular": "version",
      "value": "1.0.0"
    }]);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('meta', {"particular": "version"});
  }
};
