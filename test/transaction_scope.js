/**
 * Created by emmet on 30/04/2017.
 */
const {sequelize} = require('../app/models/persistence/index');

/**
 * Opens a transaction before each tests and rollbacks it back after each tests.
 * Saves the transaction as a global variable.
 */
module.exports = () =>
{
  // Create unmanaged transaction.
  global.beforeEach(() => sequelize.transaction().then(transaction =>
  {
    // Store the transaction to be used in after each.
    global.transaction = transaction;
  }));

  // Rolls back the transaction.
  global.afterEach(() => global.transaction.rollback());
};