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

  IsTimeRangeOverlapping(timeRanges)
  {
    for (let i = 0; i < timeRanges.length; i++)
      for (let j = 0; j < timeRanges.length; j++)
      {
        if (i === j)
          continue;

        const firstTimeRange = timeRanges[i];
        const secondTimeRange = timeRanges[j];
        if (this.IsBetweenTimeRange(firstTimeRange.startTime, secondTimeRange) ||
          this.IsBetweenTimeRange(firstTimeRange.endTime, secondTimeRange) ||
          this.IsBetweenTimeRange(secondTimeRange.startTime, firstTimeRange) ||
          this.IsBetweenTimeRange(secondTimeRange.endTime, firstTimeRange))
          return true;
      }
    return false;
  }
}

/**
 * Register the Loader service to Angular.
 */
angular.module('custom-validator')
  .service('CustomValidator', CustomValidator);