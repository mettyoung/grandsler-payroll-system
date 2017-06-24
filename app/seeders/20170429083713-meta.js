'use strict';

module.exports = {
  up: function (queryInterface, Sequelize)
  {
    return queryInterface.bulkInsert('meta', [
      {
        "particular": "version",
        "value": "1.0.0"
      },
      {
        "particular": "tolerable_threshold",
        "value": "5"
      }]);
  },

  down: function (queryInterface, Sequelize)
  {
    return queryInterface.bulkDelete('meta', {"particular": "version"});
  }
};
