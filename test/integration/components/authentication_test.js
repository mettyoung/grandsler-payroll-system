/**
 * Test Helpers
 */
const {expect} = require('chai');
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

  const USERNAME = "admin";
  const PASSWORD = "admin";
  let controller;

  beforeEach(ngModule('authentication'));
  beforeEach(inject($componentController => controller = $componentController('logIn')));

  it("should be able to log-in successfully with correct credentials", function(done){
    controller.username = USERNAME;
    controller.password = PASSWORD;
    controller.login({target: {disabled: false}}).then(() => {
      expect(controller.isAuthenticated).to.be.true;
      done();
    });
  });

  it("should be able to restrict invalid user credentials", function(done){
    controller.username = USERNAME + "wrong-username";
    controller.password = PASSWORD + "wrong-password";
    controller.login({target: {disabled: false}}).then(() => {
      expect(controller.isAuthenticated).to.be.false;
      done();
    });
  });
});