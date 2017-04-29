'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('SALARY_CRITERIA', [{
      name: "Regular Pay",
      mark_up: 0,
      updated_by: 1,
      updated_at: queryInterface.sequelize.fn('NOW')
    }, {
      name: "Overtime Pay",
      minimum_minutes: 15,
      mark_up: 30,
      updated_by: 1,
      updated_at: queryInterface.sequelize.fn('NOW')
    }, {
      name: "Night-differential Pay",
      mark_up: 10,
      updated_by: 1,
      updated_at: queryInterface.sequelize.fn('NOW')
    }])
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('SALARY_CRITERIA', {
      "name": ["Regular Pay", "Overtime Pay", "Night-differential Pay"]
    });
  }
};
