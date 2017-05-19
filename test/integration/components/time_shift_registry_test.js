/**
 * Test Helpers
 */
require('../../helpers/unit_helper');
require('../../helpers/integration_helper');
require('../../helpers/authentication_helper');

/**
 * System Under Test
 */
require('../../../app/components/time_shift_registry/time_shift_registry.module');
require('../../../app/components/time_shift_registry/time_shift_registry.component');
require('../../../app/components/time_shift_registry/time_shift_registry.config');
/**
 * Specs
 */
describe('Time Shift Registry Component', function ()
{
  /**
   * Constants and variables
   */
  const MAIN_TEMPLATE = './app/components/time_shift_registry/time_shift_registry.template.html';

  const EXPECTED_MESSAGE = {
    created: {
      user_id: ADMIN_USER.id,
      module: 'Time Shift Registry',
      description: 'Created a time-shift successfully!'
    },
    deleted: {
      user_id: ADMIN_USER.id,
      module: 'Time Shift Registry',
      description: 'Deleted a time-shift successfully!'
    },
    modified: {
      user_id: ADMIN_USER.id,
      module: 'Time Shift Registry',
      description: 'Modified a time-shift successfully!'
    }
  };

  let $services = {
    $scope: null,
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
  beforeEach(ngModule('time-shift-registry'));
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
      $services.$controller = $componentController('timeShiftRegistry', {
        $scope: $services.$scope,
        $mdDialog: $services.$mdDialog
      });

      // Import dom
      $services.$dom = $('<md-dialog>').append($(fs.readFileSync(MAIN_TEMPLATE).toString()));

      // Remove the icons to prevent the icon provider errors.
      $services.$dom.find('md-icon').remove();

      // Compile the template and scope.
      $compile($services.$dom)($services.$scope);
      $services.$scope.$digest();

      // Store dependencies
      $services.ModelProvider = ModelProvider;
      $services.ModelProvider.load();
    }
  ));

  describe("Reading", function ()
  {
    beforeEach(() =>
    {
      return $services.ModelProvider.models.TimeShift.create({
        salary_criterion_id: 1,
        name: 'Regular Shift',
        TimeFrames: [
          {
            fixed_in_index: 'flex_in_from',
            flex_in_from: moment({hour: 7, minute: 30}).toDate(),
            flex_in_to: moment({hour: 9, minute: 0}).toDate(),
            fixed_out_index: 'flex_out_from',
            flex_out_from: moment({hour: 12, minute: 0}).toDate(),
            flex_out_to: moment({hour: 12, minute: 30}).toDate()
          },
          {
            fixed_in_index: 'flex_in_to',
            flex_in_from: moment({hour: 13, minute: 0}).toDate(),
            flex_in_to: moment({hour: 13, minute: 30}).toDate(),
            fixed_out_index: 'flex_out_to',
            flex_out_from: moment({hour: 18, minute: 0}).toDate(),
            flex_out_to: moment({hour: 19, minute: 30}).toDate()
          }
        ]
      }, {
        include: [$services.ModelProvider.models.TimeFrame],
        transaction: transaction
      });
    });

    beforeEach(() =>
    {
      return $services.ModelProvider.models.TimeShift.create({
        salary_criterion_id: 3,
        name: 'Night Shift',
        TimeFrames: [
          {
            fixed_in_index: 'flex_in_from',
            flex_in_from: moment({hour: 22, minute: 0}).toDate(),
            flex_in_to: moment({hour: 22, minute: 0}).toDate(),
            fixed_out_index: 'flex_out_from',
            flex_out_from: moment({hour: 8, minute: 0}).toDate(),
            flex_out_to: moment({hour: 8, minute: 0}).toDate()
          }
        ]
      }, {
        include: [$services.ModelProvider.models.TimeFrame],
        transaction: transaction
      });
    });

    it("should load the time-shifts from the database", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        const $listItems = $services.$dom.find('#master-container md-list md-list-item');
        expect($listItems.length).to.equal(2);
        expect($($listItems.find('.name')[0]).text()).to.equal('Regular Shift');
        expect($($listItems.find('.name')[1]).text()).to.equal('Night Shift');
      });
    });

    it("should only display the error message and cancel button if initial loading of database failed", function ()
    {
      expect($services.$dom.find('#load-error-message').hasClass('ng-hide')).to.be.true;
      expect($services.$dom.find('#main-content').hasClass('ng-hide')).to.be.false;
      expect($services.$dom.find('#save-button').hasClass('ng-hide')).to.be.false;
      expect($services.$dom.find('#create-new-time-shift').hasClass('ng-hide')).to.be.false;
      expect($services.$dom.find('#cancel-button').hasClass('ng-hide')).to.be.false;

      $services.ModelProvider.models =
      {
        TimeShift: {
          findAll()
          {
            return Promise.reject({
              name: 'Mock Error',
              message: 'Error Message'
            });
          }
        },
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

      return $services.$controller.load(transaction).then(() =>
      {
        expect($services.$dom.find('#load-error-message').text()).to.contain('Mock Error')
          .and.contain('Error Message');
        expect($services.$dom.find('#load-error-message').hasClass('ng-hide')).to.be.false;
        expect($services.$dom.find('#main-content').hasClass('ng-hide')).to.be.true;
        expect($services.$dom.find('#save-button').hasClass('ng-hide')).to.be.true;
        expect($services.$dom.find('#create-new-time-shift').hasClass('ng-hide')).to.be.true;
        expect($services.$dom.find('#cancel-button').hasClass('ng-hide')).to.be.false;
      });
    });

    it("should load the time-frames of the first entry on load from the database", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        const $header = $services.$dom.find('#detail-container .panel-heading');
        const $details = $services.$dom.find('#detail-container md-list-item');

        expect($header.find('#name').val()).to.equal('Regular Shift');
        expect($header.find('#salary-criterion md-option[selected=selected]').text().trim()).to.equal('Regular');
        expect($.map($header.find('#salary-criterion md-option'), option => $(option).text().trim()))
          .to.deep.equal(['Regular', 'Night-differential']);

        expect($details.length).to.equal(2);

        expect($($details[0]).find('.fixed-in input[hidden]').val()).to.equal('flex_in_from');
        expect($($details[0]).find('.flex-in-from input').val()).to.equal('07:30:00.000');
        expect($($details[0]).find('.flex-in-to input').val()).to.equal('09:00:00.000');
        expect($($details[0]).find('.fixed-out input[hidden]').val()).to.equal('flex_out_from');
        expect($($details[0]).find('.flex-out-from input').val()).to.equal('12:00:00.000');
        expect($($details[0]).find('.flex-out-to input').val()).to.equal('12:30:00.000');

        expect($($details[1]).find('.fixed-in input[hidden]').val()).to.equal('flex_in_to');
        expect($($details[1]).find('.flex-in-from input').val()).to.equal('13:00:00.000');
        expect($($details[1]).find('.flex-in-to input').val()).to.equal('13:30:00.000');
        expect($($details[1]).find('.fixed-out input[hidden]').val()).to.equal('flex_out_to');
        expect($($details[1]).find('.flex-out-from input').val()).to.equal('18:00:00.000');
        expect($($details[1]).find('.flex-out-to input').val()).to.equal('19:30:00.000');
      });
    });

    it("should be able to switch detail view based on master list item of choice", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        return $services.$controller.selectMasterItem($services.$controller.timeShifts[1], transaction)
          .then(() =>
          {
            const $header = $services.$dom.find('#detail-container .panel-heading');
            const $details = $services.$dom.find('#detail-container md-list-item');

            expect($header.find('#name').val()).to.equal('Night Shift');
            expect($header.find('#salary-criterion md-option[selected=selected]').text().trim()).to.equal('Night-differential');
            expect($.map($header.find('#salary-criterion md-option'), option => $(option).text().trim()))
              .to.deep.equal(['Regular', 'Night-differential']);

            expect($details.length).to.equal(1);

            expect($($details[0]).find('.fixed-in input[hidden]').val()).to.equal('flex_in_from');
            expect($($details[0]).find('.flex-in-from input').val()).to.equal('22:00:00.000');
            expect($($details[0]).find('.flex-in-to input').val()).to.equal('22:00:00.000');
            expect($($details[0]).find('.fixed-out input[hidden]').val()).to.equal('flex_out_from');
            expect($($details[0]).find('.flex-out-from input').val()).to.equal('08:00:00.000');
            expect($($details[0]).find('.flex-out-to input').val()).to.equal('08:00:00.000');
          });
      });
    });

    it("should hide the detail content if there's no selected time shift.", function ()
    {
      expect($services.$dom.find('#detail-container').hasClass('ng-hide')).to.be.true;
      $services.$controller.selectedTimeShift = {};
      $services.$scope.$digest();
      expect($services.$dom.find('#detail-container').hasClass('ng-hide')).to.be.false;
    });

    it("should reload the time shifts when selected", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        return $services.$controller.selectMasterItem($services.$controller.timeShifts[1], transaction)
          .then(() =>
          {
            $services.$dom.find('#create-new-time-frame').click();
            const $details = $services.$dom.find('#detail-container md-list-item');
            expect($details.length).to.equal(2);

            // Must reload
            return $services.$controller.selectMasterItem($services.$controller.timeShifts[1], transaction)
              .then(() =>
              {
                const $details = $services.$dom.find('#detail-container md-list-item');
                expect($details.length).to.equal(1);
              });
          });
      });
    });
  });

  describe("Validations", function ()
  {
    it("should require text for all fields for the headers", () =>
    {
      return $services.$controller.load().then(() =>
      {
        $services.$dom.find('#create-new-time-shift').click();

        expect($services.$controller.Form['name'].$error).to.have.property('required');
        expect($services.$controller.Form['salary_criterion'].$error).to.have.property('required');

        $services.$controller.Form['name'].$setViewValue('12');
        $services.$controller.Form['salary_criterion'].$setViewValue(1);
        expect($services.$controller.Form['name'].$error).to.not.have.property('required');
        expect($services.$controller.Form['salary_criterion'].$error).to.not.have.property('required');
      });
    });

    it("should disable the save button if there's a validation error", function ()
    {
      return $services.$controller.load().then(() =>
      {
        $services.$dom.find('#create-new-time-shift').click();
        expect($services.$dom.find('button#save-button').is(':disabled')).to.be.true;

        $services.$controller.Form['name'].$setViewValue('12');
        $services.$controller.Form['salary_criterion'].$setViewValue('1');
        expect($services.$dom.find('button#save-button').is(':disabled')).to.be.false;
      });
    });

    it("should require text and selection of fixed time in time frames", function ()
    {
      return $services.$controller.load().then(() =>
      {
        $services.$dom.find('#create-new-time-shift').click();
        $services.$dom.find('#create-new-time-frame').click();

        expect($services.$controller.Form['flex_in_from_0'].$error).to.have.property('required');
        expect($services.$controller.Form['flex_in_to_0'].$error).to.have.property('required');
        expect($services.$controller.Form['flex_out_from_0'].$error).to.have.property('required');
        expect($services.$controller.Form['flex_out_to_0'].$error).to.have.property('required');

        $services.$controller.Form['flex_in_from_0'].$setViewValue('12:00');
        $services.$controller.Form['flex_in_to_0'].$setViewValue('12:00');
        $services.$controller.Form['flex_out_from_0'].$setViewValue('12:00');
        $services.$controller.Form['flex_out_to_0'].$setViewValue('12:00');
        expect($services.$controller.Form['flex_in_from_0'].$error).to.not.have.property('required');
        expect($services.$controller.Form['flex_in_to_0'].$error).to.not.have.property('required');
        expect($services.$controller.Form['flex_out_from_0'].$error).to.not.have.property('required');
        expect($services.$controller.Form['flex_out_to_0'].$error).to.not.have.property('required');

        expect($services.$dom.find('#save-button').is(":disabled")).to.be.true;
        $services.$controller.Form['name'].$setViewValue('12');
        $services.$controller.Form['salary_criterion'].$setViewValue(1);
        $services.$dom.find('.fixed-in:eq(0) md-radio-button:eq(0)').click();
        $services.$dom.find('.fixed-out:eq(0) md-radio-button:eq(0)').click();
        expect($services.$dom.find('#save-button').is(":disabled")).to.be.false;
      });
    });

    it("should validate the time frames before saving", function ()
    {
      return $services.$controller.load().then(() =>
      {
        $services.$dom.find('#create-new-time-shift').click();

        $services.$controller.selectedTimeShift = {
          name: 'Regular Shift',
          salary_criterion_id: 1,
          TimeFrames: [
            {
              fixed_in_index: 'flex_in_from',
              fixed_out_index: 'flex_out_from',
              flex_in_from: moment('11:00 PM', 'hh:mm A').toDate(),
              flex_in_to: moment('01:30 AM', 'hh:mm A').toDate(),
              flex_out_from: moment('10:00 PM', 'hh:mm A').toDate(),
              flex_out_to: moment('10:45 PM', 'hh:mm A').toDate()
            },
            {
              fixed_in_index: 'flex_in_from',
              fixed_out_index: 'flex_out_from',
              flex_in_from: moment('11:00 PM', 'hh:mm A').toDate(),
              flex_in_to: moment('01:30 AM', 'hh:mm A').toDate(),
              flex_out_from: moment('02:00 AM', 'hh:mm A').toDate(),
              flex_out_to: moment('04:00 AM', 'hh:mm A').toDate()
            }
          ]
        };

        return $services.$controller.saveSelectedMasterItem(transaction).then(() =>
        {
          expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.false;
          expect($services.$dom.find('div#save-error-message').text()).to.contain('Validation Error')
            .and.contain("Time frames must not be overlapping.");
        });
      });
    });
  });

  describe("Deleting", function ()
  {
    beforeEach(() =>
    {
      return $services.ModelProvider.models.TimeShift.create({
        salary_criterion_id: 1,
        name: 'Regular Shift',
        TimeFrames: [
          {
            fixed_in_index: 'flex_in_from',
            flex_in_from: moment({hour: 7, minute: 30}).toDate(),
            flex_in_to: moment({hour: 9, minute: 0}).toDate(),
            fixed_out_index: 'flex_out_from',
            flex_out_from: moment({hour: 12, minute: 0}).toDate(),
            flex_out_to: moment({hour: 12, minute: 30}).toDate()
          },
          {
            fixed_in_index: 'flex_in_to',
            flex_in_from: moment({hour: 13, minute: 0}).toDate(),
            flex_in_to: moment({hour: 13, minute: 30}).toDate(),
            fixed_out_index: 'flex_out_to',
            flex_out_from: moment({hour: 18, minute: 0}).toDate(),
            flex_out_to: moment({hour: 19, minute: 30}).toDate()
          }
        ]
      }, {
        include: [$services.ModelProvider.models.TimeFrame],
        transaction: transaction
      });
    });

    beforeEach(() =>
    {
      return $services.ModelProvider.models.TimeShift.create({
        salary_criterion_id: 3,
        name: 'Night Shift',
        TimeFrames: [
          {
            fixed_in_index: 'flex_in_from',
            flex_in_from: moment({hour: 22, minute: 0}).toDate(),
            flex_in_to: moment({hour: 22, minute: 0}).toDate(),
            fixed_out_index: 'flex_out_from',
            flex_out_from: moment({hour: 8, minute: 0}).toDate(),
            flex_out_to: moment({hour: 8, minute: 0}).toDate()
          }
        ]
      }, {
        include: [$services.ModelProvider.models.TimeFrame],
        transaction: transaction
      });
    });

    it("should delete the selectedTimeShift from the database", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        return $services.$controller.deleteSelectedMasterItem(transaction).then(() =>
        {
          return $services.$controller.load(transaction).then(() =>
          {
            const $listItems = $services.$dom.find('#master-container md-list md-list-item');
            expect($listItems.length).to.equal(1);
            expect($($listItems.find('.name')[0]).text()).to.equal('Night Shift');
          });
        });
      });
    });

    it("should disable the delete button if creating new", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        expect($services.$dom.find('#delete-time-shift').is(":disabled")).to.be.false;
        $services.$dom.find('#create-new-time-shift').click();
        expect($services.$dom.find('#delete-time-shift').is(":disabled")).to.be.true;
      });
    });

    it("should be able to delete time-frame", function()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        $services.$dom.find('#create-new-time-shift').click();
        $services.$dom.find('#create-new-time-frame').click();
        $services.$dom.find('#create-new-time-frame').click();

        $services.$controller.selectedTimeShift.TimeFrames[0] = {
          flex_in_from: moment('08:00 AM', 'hh:mm A').toDate(),
          flex_in_to: moment('09:00 AM', 'hh:mm A').toDate(),
          flex_out_from: moment('10:00 AM', 'hh:mm A').toDate(),
          flex_out_to: moment('11:00 AM', 'hh:mm A').toDate(),
          fixed_in_index: 'flex_in_from',
          fixed_out_index: 'flex_out_from'
        };

        $services.$controller.selectedTimeShift.TimeFrames[1] = {
          flex_in_from: moment('08:00 PM', 'hh:mm A').toDate(),
          flex_in_to: moment('09:00 PM', 'hh:mm A').toDate(),
          flex_out_from: moment('10:00 PM', 'hh:mm A').toDate(),
          flex_out_to: moment('11:00 PM', 'hh:mm A').toDate(),
          fixed_in_index: 'flex_in_to',
          fixed_out_index: 'flex_out_to'
        };
        $services.$scope.$digest();

        expect($services.$controller.selectedTimeShift.TimeFrames.length).to.equal(2);
        return $services.$controller.deleteDetailItem($services.$controller.selectedTimeShift.TimeFrames[0]).then(() =>
        {
          expect($services.$controller.selectedTimeShift.TimeFrames.length).to.equal(1);
          expect($services.$controller.selectedTimeShift.TimeFrames[0].flex_in_from).to.deep.equal(moment('08:00 PM', 'hh:mm A').toDate());
          expect($services.$controller.selectedTimeShift.TimeFrames[0].flex_in_to).to.deep.equal(moment('09:00 PM', 'hh:mm A').toDate());
          expect($services.$controller.selectedTimeShift.TimeFrames[0].flex_out_from).to.deep.equal(moment('10:00 PM', 'hh:mm A').toDate());
          expect($services.$controller.selectedTimeShift.TimeFrames[0].flex_out_to).to.deep.equal(moment('11:00 PM', 'hh:mm A').toDate());
          expect($services.$controller.selectedTimeShift.TimeFrames[0]).to.deep.include({
            fixed_in_index: 'flex_in_to',
            fixed_out_index: 'flex_out_to'
          });
        });
      });
    });
  });

  describe("Creating and updating", function ()
  {
    let selectedTimeShift;

    beforeEach(() =>
    {
      selectedTimeShift = {
        name: 'Regular',
        salary_criterion_id: 1,
        TimeFrames: [
          {
            flex_in_from: moment('08:00 AM', 'hh:mm A').toDate(),
            flex_in_to: moment('09:00 AM', 'hh:mm A').toDate(),
            flex_out_from: moment('10:00 AM', 'hh:mm A').toDate(),
            flex_out_to: moment('11:00 AM', 'hh:mm A').toDate(),
            fixed_in_index: 'flex_in_from',
            fixed_out_index: 'flex_out_from'
          }
        ]
      };
    });

    it("should replace the detail view with a form of blank fields when creating new", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        $services.$dom.find('#create-new-time-shift').click();

        expect($services.$dom.find('#detail-container').hasClass('ng-hide')).to.be.false;
        const $header = $services.$dom.find('#detail-container .panel-heading');
        const $details = $services.$dom.find('#detail-container md-list-item');

        expect($header.find('#name').val()).to.equal('');
        expect($header.find('#salary-criterion md-option:selected').length).to.equal(0);
        expect($.map($header.find('#salary-criterion md-option'), option => $(option).text().trim()))
          .to.deep.equal(['Regular', 'Night-differential']);

        expect($details.length).to.equal(0);
      });
    });

    it("should be able to add a new time frame", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        $services.$dom.find('#create-new-time-shift').click();
        $services.$dom.find('#create-new-time-frame').click();

        const $header = $services.$dom.find('#detail-container .panel-heading');
        const $details = $services.$dom.find('#detail-container md-list-item');

        expect($header.find('#name').val()).to.equal('');
        expect($header.find('#salary-criterion md-option:selected').length).to.equal(0);
        expect($.map($header.find('#salary-criterion md-option'), option => $(option).text().trim()))
          .to.deep.equal(['Regular', 'Night-differential']);

        expect($details.length).to.equal(1);
        expect($($details[0]).find('.fixed-in input[hidden]').val()).to.equal('');
        expect($($details[0]).find('.flex-in-from input').val()).to.equal('');
        expect($($details[0]).find('.flex-in-to input').val()).to.equal('');
        expect($($details[0]).find('.fixed-out input[hidden]').val()).to.equal('');
        expect($($details[0]).find('.flex-out-from input').val()).to.equal('');
        expect($($details[0]).find('.flex-out-to input').val()).to.equal('');
      });
    });

    it("should be able to create a new time-shift to the database", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        $services.$controller.selectedTimeShift = selectedTimeShift;
        return $services.$controller.saveSelectedMasterItem(transaction).then(() =>
          $services.ModelProvider.models.TimeShift.findOne({
            transaction: transaction,
            include: [$services.ModelProvider.models.TimeFrame]
          }).then(timeShift =>
          {
            timeShift = timeShift.get({plain: true});
            const timeFrames = timeShift.TimeFrames;
            delete timeShift.TimeFrames;

            expect(timeShift).to.deep.include({
              name: 'Regular',
              salary_criterion_id: 1
            });

            expect(timeFrames.length).to.equal(1);
            expect(timeFrames[0].flex_in_from).to.deep.equal(moment('08:00 AM', 'hh:mm A').toDate());
            expect(timeFrames[0].flex_in_to).to.deep.equal(moment('09:00 AM', 'hh:mm A').toDate());
            expect(timeFrames[0].flex_out_from).to.deep.equal(moment('10:00 AM', 'hh:mm A').toDate());
            expect(timeFrames[0].flex_out_to).to.deep.equal(moment('11:00 AM', 'hh:mm A').toDate());
            expect(timeFrames[0]).to.deep.include({
              fixed_in_index: 'flex_in_from',
              fixed_out_index: 'flex_out_from'
            });
          }));
      });
    });

    it("should be able to update an existing time-shift to the database", function ()
    {
      return $services.ModelProvider.models.TimeShift.create(selectedTimeShift, {
        transaction: transaction,
        include: [$services.ModelProvider.models.TimeFrame]
      }).then(() => $services.$controller.load(transaction))
        .then(() =>
        {
          $services.$controller.selectedTimeShift.name = 'Hello';
          return $services.$controller.saveSelectedMasterItem(transaction).then(() =>
            $services.ModelProvider.models.TimeShift.findOne({
              transaction: transaction,
              include: [$services.ModelProvider.models.TimeFrame]
            }).then(timeShift =>
            {
              timeShift = timeShift.get({plain: true});
              const timeFrames = timeShift.TimeFrames;
              delete timeShift.TimeFrames;

              expect(timeShift).to.deep.include({
                name: 'Hello',
                salary_criterion_id: 1
              });

              expect(timeFrames.length).to.equal(1);
              expect(timeFrames[0].flex_in_from).to.deep.equal(moment('08:00 AM', 'hh:mm A').toDate());
              expect(timeFrames[0].flex_in_to).to.deep.equal(moment('09:00 AM', 'hh:mm A').toDate());
              expect(timeFrames[0].flex_out_from).to.deep.equal(moment('10:00 AM', 'hh:mm A').toDate());
              expect(timeFrames[0].flex_out_to).to.deep.equal(moment('11:00 AM', 'hh:mm A').toDate());
              expect(timeFrames[0]).to.deep.include({
                fixed_in_index: 'flex_in_from',
                fixed_out_index: 'flex_out_from'
              });
            }));
        });
    });

    it("should only call the save operation one at a time", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        $services.$controller.selectedTimeShift = selectedTimeShift;

        expect(typeof $services.$controller.saveSelectedMasterItem(transaction)).to.not.equal('undefined');
        expect(typeof $services.$controller.saveSelectedMasterItem(transaction)).to.equal('undefined');
      });
    });

    it("should format and show the error message when saving failed", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        $services.$controller.selectedTimeShift = selectedTimeShift;
        $services.$controller.selectedTimeShift.name = null;
        expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.true;
        return $services.$controller.saveSelectedMasterItem(transaction).then(() =>
        {
          $services.$controller.selectedTimeShift.name = 'Regular';
          expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.false;
          expect($services.$dom.find('div#save-error-message').text()).to.contain('SequelizeDatabaseError')
            .and.contain("ER_BAD_NULL_ERROR: Column 'name' cannot be null");
        });
      });
    });

    it('should hide error message if the error is resolved', function ()
    {
      return $services.$controller.load().then(() =>
      {
        $services.$controller.selectedTimeShift = selectedTimeShift;
        $services.$controller.selectedTimeShift.name = null;
        expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.true;
        return $services.$controller.saveSelectedMasterItem(transaction).then(() =>
        {
          expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.false;
          $services.$controller.selectedTimeShift.name = 'Regular';
          return $services.$controller.saveSelectedMasterItem(transaction).then(() =>
          {
            expect($services.$dom.find('div#save-error-message').hasClass('ng-hide')).to.be.true;
          });
        });
      });
    });
  });

  describe("Dialog", function ()
  {
    let selectedTimeShift;

    beforeEach(() =>
    {
      selectedTimeShift = {
        name: 'Regular',
        salary_criterion_id: 1,
        TimeFrames: [
          {
            flex_in_from: moment('08:00 AM', 'hh:mm A').toDate(),
            flex_in_to: moment('09:00 AM', 'hh:mm A').toDate(),
            flex_out_from: moment('10:00 AM', 'hh:mm A').toDate(),
            flex_out_to: moment('11:00 AM', 'hh:mm A').toDate(),
            fixed_in_index: 'flex_in_from',
            fixed_out_index: 'flex_out_from'
          }
        ]
      };
    });

    it("should hide the dialog if close() is called", function ()
    {
      expect($services.$mdDialog.isHideCalled).to.be.false;
      $services.$dom.find('#close-button').click();
      expect($services.$mdDialog.isHideCalled).to.be.true;
    });

    it("should not hide the dialog if saving failed", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        $services.$controller.selectedTimeShift = selectedTimeShift;

        $services.$controller.selectedTimeShift.name = null;

        return $services.$controller.saveSelectedMasterItem(transaction).then(() =>
        {
          expect($services.$mdDialog.isHideCalled).to.be.false;
        });
      });
    });

    it("should hide the dialog if saving is successful", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        $services.$controller.selectedTimeShift = selectedTimeShift;

        return $services.$controller.saveSelectedMasterItem(transaction).then(() =>
        {
          expect($services.$mdDialog.isHideCalled).to.be.true;
        });
      });
    });

    it("should not hide the dialog if deleting failed", function ()
    {
      return $services.$controller.load(transaction).then(() =>
      {
        $services.$controller.selectedTimeShift = selectedTimeShift;

        return $services.$controller.deleteSelectedMasterItem(transaction).then(() =>
        {
          expect($services.$mdDialog.isHideCalled).to.be.false;
        });
      });
    });

    it("should hide the dialog if deleting is successful", function ()
    {
      return $services.ModelProvider.models.TimeShift.create(selectedTimeShift, {
        transaction: transaction,
        include: [$services.ModelProvider.models.TimeFrame]
      }).then(() =>
      {
        return $services.$controller.load(transaction).then(() =>
        {
          return $services.$controller.deleteSelectedMasterItem(transaction).then(() =>
          {
            expect($services.$mdDialog.isHideCalled).to.be.true;
          });
        });
      });
    });
  });

  describe('Service Integrations', function ()
  {
    let selectedTimeShift;

    beforeEach(() =>
    {
      selectedTimeShift = {
        name: 'Regular',
        salary_criterion_id: 1,
        TimeFrames: [
          {
            flex_in_from: moment('08:00 AM', 'hh:mm A').toDate(),
            flex_in_to: moment('09:00 AM', 'hh:mm A').toDate(),
            flex_out_from: moment('10:00 AM', 'hh:mm A').toDate(),
            flex_out_to: moment('11:00 AM', 'hh:mm A').toDate(),
            fixed_in_index: 'flex_in_from',
            fixed_out_index: 'flex_out_from'
          }
        ]
      };
    });

    it("should propagate the created message to the Notifier if time-shift is successfully created", function ()
    {
      return $services.$controller.load().then(() =>
      {
        $services.$controller.selectedTimeShift = selectedTimeShift;
        const date = new Date();
        return $services.$controller.saveSelectedMasterItem(transaction).then(() =>
        {
          let s = Object.assign(EXPECTED_MESSAGE.created, {
            created_at: {
              $gte: date
            }
          });
          return $services.ModelProvider.models.UserLog.findOne({
            where: Object.assign(EXPECTED_MESSAGE.created, {
              created_at: {
                $gte: date
              }
            }),
            transaction: transaction
          }).should.eventually.not.be.a('null')
        });
      });
    });

    it("should propagate the modified message to the Notifier if time-shift is successfully created", function ()
    {
      return $services.$controller.load().then(() =>
      {
        $services.$controller.selectedTimeShift = selectedTimeShift;
        const date = new Date();
        return $services.$controller.saveSelectedMasterItem(transaction).then(() =>
          $services.$controller.saveSelectedMasterItem(transaction).then(() =>
          {
            return $services.ModelProvider.models.UserLog.findOne({
              where: Object.assign(EXPECTED_MESSAGE.modified, {
                created_at: {
                  $gte: date
                }
              }),
              transaction: transaction
            }).should.eventually.not.be.a('null')
          })
        );
      })
    });

    it("should propagate the deleted message to the Notifier if time-shift is successfully created", function ()
    {
      $services.$controller.selectedTimeShift = selectedTimeShift;
      return $services.$controller.load().then(() =>
      {
        const date = new Date();
        return $services.$controller.saveSelectedMasterItem(transaction)
          .then(() => $services.$controller.load())
          .then(() =>
            $services.$controller.deleteSelectedMasterItem(transaction).then(() =>
            {
              return $services.ModelProvider.models.UserLog.findOne({
                where: Object.assign(EXPECTED_MESSAGE.deleted, {
                  created_at: {
                    $gte: date
                  }
                }),
                transaction: transaction
              }).should.eventually.not.be.a('null')
            })
          );
      })
    });

    it("should not propagate the message to the Notifier if operation failed", function ()
    {
      return $services.$controller.load().then(() =>
      {
        const date = new Date();
        $services.$controller.selectedTimeShift = selectedTimeShift;
        $services.$controller.selectedTimeShift.name = null;
        return $services.$controller.saveSelectedMasterItem(transaction).then(() =>
        {
          return $services.ModelProvider.models.UserLog.findOne({
            where: Object.assign(EXPECTED_MESSAGE.created, {
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
});