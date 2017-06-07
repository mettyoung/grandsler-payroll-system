'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(
      `ALTER TABLE 
        stock_codes_operations 
      ADD CONSTRAINT 
        stock_codes_operations_ibfk_2 
      FOREIGN KEY (pipeline_id, operation_id) 
      REFERENCES pipelines_operations (pipeline_id, operation_id);`)
  },
  down: function(queryInterface, Sequelize) {
    return queryInterface.sequelize.query("ALTER TABLE stock_codes_operations DROP FOREIGN KEY stock_codes_operations_ibfk_2;")
  }
};
