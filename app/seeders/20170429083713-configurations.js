'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('configurations', [{
      "particular": "version",
      "value": "1.0.0"
    }]);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('configurations', {"particular": "version"});
  }
};
