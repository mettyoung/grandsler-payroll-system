/**
 * Test Helpers
 */
require('../../helpers/unit_helper');
require('../../helpers/integration_helper');
require('../../helpers/authentication_helper');

/**
 * System Under Test
 */
require('../../../app/components/salary_criteria/salary_criteria.module');
require('../../../app/components/salary_criteria/salary_criteria.component');

/**
 * Specs
 */
describe('Salary Criteria Component', function ()
{
  /**
   * Constants and variables
   */
  const SALARY_CRITERIA_TEMPLATE = './app/components/salary_criteria/salary_criteria.template.html';

  const EXPECTED_MESSAGE = {
    user_id: ADMIN_USER.id,
    module: 'Salary Criteria Registry',
    description: 'Changed salary criteria successfully!'
  };

  let $services = {
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
  beforeEach(ngModule('salary-criteria'));
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
      $services.$controller = $componentController('salaryCriteria', {
        $scope: $services.$scope,
        $mdDialog: $services.$mdDialog
      });

      // Import dom
      $services.$dom = $('<md-dialog>').append($(fs.readFileSync(SALARY_CRITERIA_TEMPLATE).toString()));

      // Compile the template and scope.
      $compile($services.$dom)($services.$scope);
      $services.$scope.$digest();

      // Store dependencies
      $services.ModelProvider = ModelProvider;
      $services.ModelProvider.load();
    }
  ));

  it("should load the values from the database", function ()
  {
    return $services.$controller.notifyOnLoad.then(() =>
    {
      expect($services.$controller.Form['overtime.minimum_minutes'].$viewValue).to.equal('15');
      expect($services.$controller.Form['overtime.mark_up'].$viewValue).to.equal('30');
      expect($services.$controller.Form['night_differential.mark_up'].$viewValue).to.equal('10');
    });
  });

  it("should only display the error message and cancel button if initial loading of database failed", function ()
  {
    return $services.$controller.notifyOnLoad
      .then(() =>
      {
        expect($services.$dom.find('#preload-error-message').hasClass('ng-hide')).to.be.true;
        expect($services.$dom.find('#main-content').hasClass('ng-hide')).to.be.false;
        expect($services.$dom.find('#save-button').hasClass('ng-hide')).to.be.false;
        expect($services.$dom.find('#cancel-button').hasClass('ng-hide')).to.be.false;

        $services.ModelProvider.models =
        {
          SALARY_CRITERION: {
            findAll()
            {
              return Promise.reject({
                name: 'Mock Error',
                message: 'Error Message'
              });
            }
          }
        };
        return $services.$controller.load();
      })
      .then(() =>
      {
        expect($services.$dom.find('#preload-error-message').text()).to.contain('Mock Error')
          .and.contain('Error Message');
        expect($services.$dom.find('#preload-error-message').hasClass('ng-hide')).to.be.false;
        expect($services.$dom.find('#main-content').hasClass('ng-hide')).to.be.true;
        expect($services.$dom.find('#save-button').hasClass('ng-hide')).to.be.true;
        expect($services.$dom.find('#cancel-button').hasClass('ng-hide')).to.be.false;
      });
  });

  it("should require text for all fields", () =>
  {
    return $services.$controller.notifyOnLoad.then(() =>
    {
      $services.$controller.Form['overtime.minimum_minutes'].$setViewValue('');
      $services.$controller.Form['overtime.mark_up'].$setViewValue('');
      $services.$controller.Form['night_differential.mark_up'].$setViewValue('');

      expect($services.$controller.Form['overtime.minimum_minutes'].$error).to.have.property('required');
      expect($services.$controller.Form['overtime.mark_up'].$error).to.have.property('required');
      expect($services.$controller.Form['night_differential.mark_up'].$error).to.have.property('required');

      $services.$controller.Form['overtime.minimum_minutes'].$setViewValue('12');
      $services.$controller.Form['overtime.mark_up'].$setViewValue('12');
      $services.$controller.Form['night_differential.mark_up'].$setViewValue('12');

      expect($services.$controller.Form['overtime.minimum_minutes'].$error).to.not.have.property('required');
      expect($services.$controller.Form['overtime.mark_up'].$error).to.not.have.property('required');
      expect($services.$controller.Form['night_differential.mark_up'].$error).to.not.have.property('required');
    });
  });

  it("should disable the save button if there's a validation error", function ()
  {
    return $services.$controller.notifyOnLoad.then(() =>
    {
      $services.$controller.Form['overtime.minimum_minutes'].$setViewValue('');
      $services.$controller.Form['overtime.mark_up'].$setViewValue('12');
      $services.$controller.Form['night_differential.mark_up'].$setViewValue('12');

      expect($services.$dom.find('button#save-button').is(':disabled')).to.be.true;

      $services.$controller.Form['overtime.minimum_minutes'].$setViewValue('12');

      expect($services.$dom.find('button#save-button').is(':disabled')).to.be.false;
    });
  });

  it("should be able to apply the changes to the database", function ()
  {
    return $services.$controller.notifyOnLoad.then(() =>
    {
      $services.$controller.Form['overtime.minimum_minutes'].$setViewValue('1');
      $services.$controller.Form['overtime.mark_up'].$setViewValue('2');
      $services.$controller.Form['night_differential.mark_up'].$setViewValue('3');

      return $services.$controller.save(transaction).then(() =>
        $services.ModelProvider.models.SALARY_CRITERION.findAll({
          order: 'name',
          where: {
            name: {
              $in: ['Overtime', 'Night-differential']
            }
          },
          transaction: transaction
        })
      ).then(salaryCriteria =>
      {
        expect(salaryCriteria[0].get({plain: true})).to.deep.include({
          name: 'Night-differential',
          mark_up: 3
        });
        expect(salaryCriteria[1].get({plain: true})).to.deep.include({
          name: 'Overtime',
          minimum_minutes: 1,
          mark_up: 2
        });
      });
    });
  });

  it("should only call the save operation one at a time", function()
  {
    return $services.$controller.notifyOnLoad.then(() =>
    {
      expect($services.$controller.save(transaction)).to.be.a('Promise');
      expect($services.$controller.save(transaction)).to.be.a('undefined');
    });
  });

  it("should format and show the error message when saving failed", function ()
  {
    return $services.$controller.notifyOnLoad.then(() =>
    {
      $services.$controller.overtime.name = null;

      expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.true;
      return $services.$controller.save(transaction).then(() =>
      {
        expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.false;
        expect($services.$dom.find('div#save-error-message').text()).to.contain('SequelizeDatabaseError')
          .and.contain("ER_BAD_NULL_ERROR: Column 'name' cannot be null");
      });
    });
  });

  it('should hide error message if the error is resolved', function ()
  {
    return $services.$controller.notifyOnLoad.then(() =>
    {
      $services.$controller.overtime.name = null;

      expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.true;
      return $services.$controller.save(transaction).then(() =>
      {
        expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.false;
        $services.$controller.overtime.name = 'Helo';
        return $services.$controller.save(transaction).then(() =>
        {
          expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.true;
        });
      });
    });
  });

  it("should hide the dialog if cancel() is called", function ()
  {
    return $services.$controller.notifyOnLoad.then(() =>
    {
      expect($services.$mdDialog.isHideCalled).to.be.false;
      $services.$controller.cancel();
      expect($services.$mdDialog.isHideCalled).to.be.true;
    });
  });

  it("should not hide the dialog if saving failed", function ()
  {
    return $services.$controller.notifyOnLoad.then(() =>
    {
      expect($services.$mdDialog.isHideCalled).to.be.false;
      $services.$controller.overtime.name = null;

      return $services.$controller.save(transaction).then(() =>
      {
        expect($services.$mdDialog.isHideCalled).to.be.false;
      });
    });
  });

  it("should hide the dialog if saving is successful", function ()
  {
    return $services.$controller.notifyOnLoad.then(() =>
    {
      expect($services.$mdDialog.isHideCalled).to.be.false;
      $services.$controller.overtime.name = 'Hello';

      return $services.$controller.save(transaction).then(() =>
      {
        expect($services.$mdDialog.isHideCalled).to.be.true;
      });
    });
  });

  it("should propagate the message to the Notifier if operation is successful", function ()
  {
    return $services.$controller.notifyOnLoad.then(() =>
    {
      const date = new Date();
      $services.$controller.overtime.name = "hello";
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
  });

  it("should not propagate the message to the Notifier if operation failed", function ()
  {
    return $services.$controller.notifyOnLoad.then(() =>
    {
      const date = new Date();
      $services.$controller.overtime.name = null;
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
});