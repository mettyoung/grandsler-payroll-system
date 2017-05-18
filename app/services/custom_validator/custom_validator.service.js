/**
 * Responsible for validation logic.
 */
class CustomValidator
{  
  IsBetweenTimeRange(time, timeRange)
  {
    let {startTime, endTime} = timeRange;

    if (endTime < startTime)
      return (startTime <= time != time <= endTime);

    return (startTime <= time && time <= endTime);
  }

  IsTimeRangeOverlapping(firstTimeRange, secondTimeRange)
  {
    return this.IsBetweenTimeRange(firstTimeRange.startTime, secondTimeRange) ||
      this.IsBetweenTimeRange(firstTimeRange.endTime, secondTimeRange) ||
      this.IsBetweenTimeRange(secondTimeRange.startTime, firstTimeRange) ||
      this.IsBetweenTimeRange(secondTimeRange.endTime, firstTimeRange);
  }
}

/**
 * Register the Loader service to Angular.
 */
angular.module('custom-validator')
  .service('CustomValidator', CustomValidator);