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
        const timeRange = {
          startTime: moment('07:30 AM', 'hh:mm A').toDate(),
          endTime: moment('12:30 PM', 'hh:mm A').toDate()
        };

        const inside = moment('9:45 AM', 'hh:mm A').toDate();
        const outside = moment('01:00 PM', 'hh:mm A').toDate();

        expect(CustomValidator.IsBetweenTimeRange(inside, timeRange)).to.be.true;
        expect(CustomValidator.IsBetweenTimeRange(outside, timeRange)).to.be.false;
      });

      it("should validate the time if it's in between the time range where time range crosses midnight", function ()
      {
        const timeRange = {
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
          expect(CustomValidator.IsBetweenTimeRange(time, timeRange)).to.be.true;

        for (let time of outside)
          expect(CustomValidator.IsBetweenTimeRange(time, timeRange)).to.be.false;
      });
    });

    describe("IsTimeRangeOverlapping", function()
    {
      it("should validate if the two time range overlaps", function()
      {
        const overlap_at_end_1_and_start_2 = [
          {
            startTime: moment('11:00 PM', 'hh:mm A').toDate(),
            endTime: moment('01:30 AM', 'hh:mm A').toDate()
          },
          {
            startTime: moment('12:30 AM', 'hh:mm A').toDate(),
            endTime: moment('3:30 AM', 'hh:mm A').toDate()
          }
        ];

        const overlap_at_start_1_and_end_2 = [
          {
            startTime: moment('11:00 PM', 'hh:mm A').toDate(),
            endTime: moment('01:30 AM', 'hh:mm A').toDate()
          },
          {
            startTime: moment('6:30 PM', 'hh:mm A').toDate(),
            endTime: moment('11:30 PM', 'hh:mm A').toDate()
          }
        ];

        const overlap_at_both = [
          {
            startTime: moment('11:00 PM', 'hh:mm A').toDate(),
            endTime: moment('01:30 AM', 'hh:mm A').toDate()
          },
          {
            startTime: moment('11:30 PM', 'hh:mm A').toDate(),
            endTime: moment('12:30 AM', 'hh:mm A').toDate()
          }
        ];

        const no_overlap_before = [
          {
            startTime: moment('11:00 PM', 'hh:mm A').toDate(),
            endTime: moment('01:30 AM', 'hh:mm A').toDate()
          },
          {
            startTime: moment('10:00 PM', 'hh:mm A').toDate(),
            endTime: moment('10:45 PM', 'hh:mm A').toDate()
          }
        ];

        const no_overlap_after = [
          {
            startTime: moment('11:00 PM', 'hh:mm A').toDate(),
            endTime: moment('01:30 AM', 'hh:mm A').toDate()
          },
          {
            startTime: moment('02:00 AM', 'hh:mm A').toDate(),
            endTime: moment('04:00 AM', 'hh:mm A').toDate()
          }
        ];

        expect(CustomValidator.IsTimeRangeOverlapping(overlap_at_end_1_and_start_2)).to.be.true;
        expect(CustomValidator.IsTimeRangeOverlapping(overlap_at_start_1_and_end_2)).to.be.true;
        expect(CustomValidator.IsTimeRangeOverlapping(overlap_at_both)).to.be.true;
        expect(CustomValidator.IsTimeRangeOverlapping(no_overlap_before)).to.be.false;
        expect(CustomValidator.IsTimeRangeOverlapping(no_overlap_after)).to.be.false;

        // Test for symmetry.
        expect(CustomValidator.IsTimeRangeOverlapping(overlap_at_end_1_and_start_2)).to.be.true;
        expect(CustomValidator.IsTimeRangeOverlapping(overlap_at_start_1_and_end_2)).to.be.true;
        expect(CustomValidator.IsTimeRangeOverlapping(overlap_at_both)).to.be.true;
        expect(CustomValidator.IsTimeRangeOverlapping(no_overlap_before)).to.be.false;
        expect(CustomValidator.IsTimeRangeOverlapping(no_overlap_after)).to.be.false;
      });

      it("should be able to accept an array of time range and determine overlaps of all of them", function()
      {
        const no_overlap = [
          {
            startTime: moment('11:30 PM', 'hh:mm A').toDate(),
            endTime: moment('01:30 AM', 'hh:mm A').toDate()
          },
          {
            startTime: moment('02:30 PM', 'hh:mm A').toDate(),
            endTime: moment('04:30 PM', 'hh:mm A').toDate()
          },
          {
            startTime: moment('05:30 PM', 'hh:mm A').toDate(),
            endTime: moment('07:30 PM', 'hh:mm A').toDate()
          },
          {
            startTime: moment('08:30 PM', 'hh:mm A').toDate(),
            endTime: moment('10:30 PM', 'hh:mm A').toDate()
          }
        ];

        const overlap = [...no_overlap,
          {
            startTime: moment('10:30 PM', 'hh:mm A').toDate(),
            endTime: moment('12:30 AM', 'hh:mm A').toDate()
          }
        ];
        
        expect(CustomValidator.IsTimeRangeOverlapping(no_overlap)).to.be.false;
        expect(CustomValidator.IsTimeRangeOverlapping(overlap)).to.be.true;
      });
    });
  });
});