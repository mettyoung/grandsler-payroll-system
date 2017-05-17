/**
 * Test Helpers
 */
require('../../helpers/unit_helper');

/**
 * System Under Test
 */
require('../../../app/services/custom_validator/custom_validator.module.js');
require('../../../app/services/custom_validator/custom_validator.service.js');

/**
 * Specs
 */
describe('Validator Angular Service', function ()
{
  let CustomValidator;
  beforeEach(ngModule('custom-validator'));
  beforeEach(inject(_CustomValidator_ => CustomValidator = _CustomValidator_));

  describe("Time validations", function ()
  {
    describe("IsBetweenTimeRange", function ()
    {
      it("should validate the time if it's in between the time range where time range does not cross midnight", function ()
      {
        const dateRange = {
          startTime: moment('07:30 AM', 'hh:mm A').toDate(),
          endTime: moment('12:30 PM', 'hh:mm A').toDate()
        };

        const inside = moment('9:45 AM', 'hh:mm A').toDate();
        const outside = moment('01:00 PM', 'hh:mm A').toDate();

        expect(CustomValidator.IsBetweenTimeRange(inside, dateRange)).to.be.true;
        expect(CustomValidator.IsBetweenTimeRange(outside, dateRange)).to.be.false;
      });

      it("should validate the time if it's in between the time range where time range crosses midnight", function ()
      {
        const dateRange = {
          startTime: moment('11:00 PM', 'hh:mm A').toDate(),
          endTime: moment('12:30 AM', 'hh:mm A').toDate()
        };

        const inside = [
          moment('11:30 PM', 'hh:mm A').toDate(),
          moment('12:15 AM', 'hh:mm A').toDate()
        ];

        const outside = [
          moment('10:30 PM', 'hh:mm A').toDate(),
          moment('01:15 AM', 'hh:mm A').toDate()
        ];

        for (let time of inside)
          expect(CustomValidator.IsBetweenTimeRange(time, dateRange)).to.be.true;

        for (let time of outside)
          expect(CustomValidator.IsBetweenTimeRange(time, dateRange)).to.be.false;
      });
    });
  });
});