'use strict';

module.exports = {
  up: function (queryInterface, Sequelize)
  {
    return queryInterface.sequelize.query(
      `ALTER TABLE 
        production_lines 
      ADD CONSTRAINT 
        production_lines_ibfk_composite 
      FOREIGN KEY (stock_code_id, pipeline_id, operation_id) 
      REFERENCES stock_codes_operations (stock_code_id, pipeline_id, operation_id)`)
      .then(() => queryInterface.sequelize.query(
        `ALTER TABLE production_lines 
            ADD INDEX idx_operation_number (operation_number ASC)`
      ));
  },
  down: function (queryInterface, Sequelize)
  {
    return queryInterface.sequelize.query("ALTER TABLE production_lines DROP FOREIGN KEY production_lines_ibfk_composite")
  }
};
