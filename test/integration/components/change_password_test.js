/**
 * Test Helpers
 */
require('../../helpers/unit_helper');
require('../../helpers/integration_helper');
require('../../helpers/authentication_helper');

/**
 * System Under Test
 */
require('../../../app/components/change_password/change_password.module');
require('../../../app/components/change_password/change_password.component');

/**
 * Specs
 */
describe('Change Password Component', function ()
{

  /**
   * Constants and variables
   */
  const CHANGE_PASSWORD_TEMPLATE = './app/components/change_password/change_password.template.html';

  const EXPECTED_MESSAGE = {
    user_id: ADMIN_USER.id,
    module: 'Account Settings',
    description: 'Changed password successfully!',
  };

  const $services = {
    $scope: {},
    $controller: null,
    $dom: null,
    $mdDialog: null,
    ModelProvider: null
  };

  /**
   * Set-up
   */
  transactionScope();
  authenticate();
  beforeEach(ngModule('change-password'));
  beforeEach(inject(
    ($rootScope, $componentController, $compile, ModelProvider) =>
    {
      // Create a new scope.
      $services.$scope = $rootScope.$new();

      // Create mock for mdDialog
      $services.$mdDialog = {
        isHideCalled: false,
        hide() {
          this.isHideCalled = true;
        }
      };

      // Store the controller and inject the scope.
      $services.$controller = $componentController('changePassword', {
        $scope: $services.$scope,
        $mdDialog: $services.$mdDialog
      });

      // Import dom
      $services.$dom = $('<md-dialog>').append($(fs.readFileSync(CHANGE_PASSWORD_TEMPLATE).toString()));

      // Compile the template and scope.
      $compile($services.$dom)($services.$scope);
      $services.$scope.$digest();

      // Store dependencies
      $services.ModelProvider = ModelProvider;
      $services.ModelProvider.load();
    }
  ));

  it("should require text for all fields", () =>
  {
    $services.$controller.Form.current_password.$setViewValue('');
    $services.$controller.Form.new_password.$setViewValue('');
    $services.$controller.Form.confirmation_password.$setViewValue('');

    expect($services.$controller.Form.current_password.$error).to.have.property('required');
    expect($services.$controller.Form.new_password.$error).to.have.property('required');
    expect($services.$controller.Form.confirmation_password.$error).to.have.property('required');

    $services.$controller.Form.current_password.$setViewValue('12');
    $services.$controller.Form.new_password.$setViewValue('12');
    $services.$controller.Form.confirmation_password.$setViewValue('12');

    expect($services.$controller.Form.current_password.$error).to.not.have.property('required');
    expect($services.$controller.Form.new_password.$error).to.not.have.property('required');
    expect($services.$controller.Form.confirmation_password.$error).to.not.have.property('required');
  });

  it("should require equality of confirmation password to new password", function ()
  {
    $services.$controller.Form.new_password.$setViewValue('12');
    $services.$controller.Form.confirmation_password.$setViewValue('1');
    expect($services.$controller.Form.confirmation_password.$error).to.have.property('compareTo');

    $services.$controller.Form.confirmation_password.$setViewValue('12');
    expect($services.$controller.Form.confirmation_password.$error).to.not.have.property('compareTo');
  });

  it("should require equality of current_password to the password of the authenticated user", function ()
  {
    $services.$controller.Form.current_password.$setViewValue(ADMIN_USER.password + "wrong-password");
    expect($services.$controller.Form.current_password.$error).to.have.property('compareTo');

    $services.$controller.Form.current_password.$setViewValue(ADMIN_USER.password);
    expect($services.$controller.Form.current_password.$error).to.not.have.property('compareTo');
  });

  it("should disable the save button if there's a validation error", function ()
  {
    $services.$controller.Form.current_password.$setViewValue('');
    $services.$controller.Form.new_password.$setViewValue('12');
    $services.$controller.Form.confirmation_password.$setViewValue('12');

    expect($services.$dom.find('button#save-button').is(':disabled')).to.be.true;

    $services.$controller.Form.current_password.$setViewValue(ADMIN_USER.password);

    expect($services.$dom.find('button#save-button').is(':disabled')).to.be.false;
  });

  it("should be able to change the password of the authenticated user", function ()
  {
    $services.$controller.Form.current_password.$setViewValue(ADMIN_USER.password);
    $services.$controller.Form.new_password.$setViewValue('12');
    $services.$controller.Form.confirmation_password.$setViewValue('12');

    return $services.$controller.save(transaction).then(() =>
      auth.user.reload({transaction: transaction}).should.eventually.deep.include({
        password: '12'
      }));
  });

  it("should only call the save operation one at a time", function ()
  {
    $services.$controller.Form.current_password.$setViewValue(ADMIN_USER.password);
    $services.$controller.Form.new_password.$setViewValue('12');
    $services.$controller.Form.confirmation_password.$setViewValue('12');
    expect(typeof $services.$controller.save(transaction)).to.not.equal('undefined');
    expect(typeof $services.$controller.save(transaction)).to.equal('undefined');
  });

  it("should not update the current_user_password of the $services.$controller when the password is changed", function ()
  {
    $services.$controller.new_password = "hello";
    expect($services.$controller.current_user_password).to.equal(ADMIN_USER.password);
    return $services.$controller.save(transaction)
      .then(() =>
      {
        expect($services.$controller.current_user_password).to.equal(ADMIN_USER.password);
      });
  });

  it("should format and show the error message when saving failed", function ()
  {
    $services.$controller.new_password = null;
    expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.true;

    return $services.$controller.save(transaction).then(() =>
    {
      expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.false;
      expect($services.$dom.find('div#save-error-message').text()).to.contain('SequelizeDatabaseError')
        .and.contain("ER_BAD_NULL_ERROR: Column 'password' cannot be null");
    });
  });

  it('should hide error message if the error is resolved', function ()
  {
    $services.$controller.new_password = null;

    expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.true;
    return $services.$controller.save(transaction).then(() =>
    {
      expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.false;
      $services.$controller.new_password = 'Helo';
      return $services.$controller.save(transaction).then(() =>
      {
        expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.true;
      });
    });
  });

  it("should hide the dialog if cancel() is called", function ()
  {
    expect($services.$mdDialog.isHideCalled).to.be.false;
    $services.$controller.cancel();
    expect($services.$mdDialog.isHideCalled).to.be.true;
  });

  it("should not hide the dialog if saving failed", function ()
  {
    expect($services.$mdDialog.isHideCalled).to.be.false;
    $services.$controller.new_password = null;

    return $services.$controller.save(transaction).then(() =>
    {
      expect($services.$mdDialog.isHideCalled).to.be.false;
    });
  });

  it("should hide the dialog if saving is successful", function ()
  {
    expect($services.$mdDialog.isHideCalled).to.be.false;
    $services.$controller.new_password = 'Hello';

    return $services.$controller.save(transaction).then(() =>
    {
      expect($services.$mdDialog.isHideCalled).to.be.true;
    });
  });

  it("should propagate the message to the Notifier if operation is successful", function ()
  {
    const date = new Date();
    $services.$controller.new_password = "hello";
    return $services.$controller.save(transaction).then(() =>
    {
      return $services.ModelProvider.models.UserLog.findOne({
        where: Object.assign(EXPECTED_MESSAGE, {
          created_at: {
            $gte: date
          }
        }),
        transaction: transaction
      }).should.eventually.not.be.a('null')
    });
  });

  it("should not propagate the message to the Notifier if operation failed", function ()
  {
    const date = new Date();
    $services.$controller.new_password = null;
    return $services.$controller.save(transaction).then(() =>
    {
      return $services.ModelProvider.models.UserLog.findOne({
        where: Object.assign(EXPECTED_MESSAGE, {
          created_at: {
            $gte: date
          }
        }),
        transaction: transaction
      }).should.eventually.be.a('null')
    });
  });
});