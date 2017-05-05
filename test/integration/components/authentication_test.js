/**
 * Test Helpers
 */
require('../../helpers/chai_with_promised');
const {ngModule, inject} = require('../../helpers/angular_test_setup');

/**
 * System Under Test
 */
require('../../../app/components/authentication/authentication.module');
require('../../../app/components/authentication/authentication.component');

/**
 * Specs
 */
describe('Authentication Angular Component', function(){

  const ADMIN_USER = {
    username: "admin",
    password: "admin"
  };

  let controller;

  beforeEach(ngModule('authentication'));
  beforeEach(inject($componentController => controller = $componentController('authentication')));

  it("should be able to log-in successfully with correct credentials", function(done){
    controller.username = ADMIN_USER.username;
    controller.password = ADMIN_USER.password;
    controller.login({target: {disabled: false}}).then(() => {
      expect(controller.isAuthenticated).to.be.true;
      done();
    });
  });

  it("should be able to restrict invalid user credentials", function(done){
    controller.username = ADMIN_USER.username + "wrong-username";
    controller.password = ADMIN_USER.password + "wrong-password";
    controller.login({target: {disabled: false}}).then(() => {
      expect(controller.isAuthenticated).to.be.false;
      done();
    });
  });
});