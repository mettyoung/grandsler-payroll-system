/**
 * Auth model.
 */
global.auth = require('../../app/models/domain/authentication');

global.ADMIN_USER = {
  id: 1,
  username: "admin",
  password: "admin"
};

global.authenticate = function()
{
  global.beforeEach(() => global.auth.attempt(ADMIN_USER.username, ADMIN_USER.password));
};