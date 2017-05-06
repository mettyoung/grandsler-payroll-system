/**
 * Test Helpers
 */
require('../../helpers/chai_with_promised');
const {ngModule, inject} = require('../../helpers/angular_test_setup');
const transactionScope = require('../../helpers/transaction_scope');

/**
 * System Under Test
 */
require('../../../app/components/change_password/change_password.module');
require('../../../app/components/change_password/change_password.component');

/**
 * Specs
 */
describe('Change Password Component', function () {

  const ADMIN_USER = {
    username: "admin",
    password: "admin"
  };
  const auth = require('../../../app/models/domain/authentication');
  transactionScope();

  let $scope;
  let $mdDialog;
  let controller;
  let dom;

  beforeEach(() => {
    return auth.attempt(ADMIN_USER.username, ADMIN_USER.password);
  });

  beforeEach(ngModule('change-password'));

  beforeEach(inject(($componentController, $compile, $rootScope) => {

    $scope = $rootScope.$new();
    $mdDialog = {
      isHideCalled: false,
      hide() {
        this.isHideCalled = true;
      }
    };
    controller = $componentController('changePassword', {$scope: $scope, $mdDialog: $mdDialog});


    dom = angular.element('<md-dialog>' + require('fs')
        .readFileSync('./app/components/change_password/change_password.template.html') +
      '</md-dialog>');
    $compile(dom)($scope);
  }));

  it("should require text for current, new and confirmation password", () => {

    controller.Form.current_password.$setViewValue('');
    controller.Form.new_password.$setViewValue('');
    controller.Form.confirmation_password.$setViewValue('');

    expect(controller.Form.current_password.$error).to.have.property('required');
    expect(controller.Form.new_password.$error).to.have.property('required');
    expect(controller.Form.confirmation_password.$error).to.have.property('required');

    controller.Form.current_password.$setViewValue('12');
    controller.Form.new_password.$setViewValue('12');
    controller.Form.confirmation_password.$setViewValue('12');

    expect(controller.Form.current_password.$error).to.not.have.property('required');
    expect(controller.Form.new_password.$error).to.not.have.property('required');
    expect(controller.Form.confirmation_password.$error).to.not.have.property('required');
  });

  it("should disable the save button if there's a validation error", function () {

    controller.Form.current_password.$setViewValue('');
    controller.Form.new_password.$setViewValue('12');
    controller.Form.confirmation_password.$setViewValue('12');

    expect(controller.Form.$valid).to.be.false;
    expect(dom.find('button')[0].disabled).to.be.true;

    controller.Form.current_password.$setViewValue(ADMIN_USER.password);

    expect(controller.Form.$valid).to.be.true;
    expect(dom.find('button')[0].disabled).to.be.false;
  });

  it("should require equality of confirmation password to new password", function () {

    controller.Form.new_password.$setViewValue('12');
    controller.Form.confirmation_password.$setViewValue('1');
    expect(controller.Form.confirmation_password.$error).to.have.property('compareTo');

    controller.Form.confirmation_password.$setViewValue('12');
    expect(controller.Form.confirmation_password.$error).to.not.have.property('compareTo');
  });

  it("should require equality of current_password to the password of the authenticated user", function () {

    controller.Form.current_password.$setViewValue(ADMIN_USER.password + "wrong-password");
    expect(controller.Form.current_password.$error).to.have.property('compareTo');

    controller.Form.current_password.$setViewValue(ADMIN_USER.password);
    expect(controller.Form.current_password.$error).to.not.have.property('compareTo');
  });

  it("should be able to change the password of the authenticated user", function () {

    controller.Form.current_password.$setViewValue(ADMIN_USER.password);
    controller.Form.new_password.$setViewValue('12');
    controller.Form.confirmation_password.$setViewValue('12');

    return controller.save({transaction: transaction}).should.eventually.deep.include({
      password: '12'
    });
  });

  it("should hide the dialog if hide() is called", function() {
  it("should not update the current_user_password of the controller when the password is changed", function () {
    controller.new_password = "hello";
    expect(controller.current_user_password).to.equal(ADMIN_USER.password);
    return controller.save({transaction: transaction})
      .then(() => {
        expect(controller.current_user_password).to.equal(ADMIN_USER.password);
      });
  });

    expect($mdDialog.isHideCalled).to.be.false;
    controller.cancel();
    expect($mdDialog.isHideCalled).to.be.true;
  });
});