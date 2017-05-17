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
}

/**
 * Register the Loader service to Angular.
 */
angular.module('custom-validator')
  .service('CustomValidator', CustomValidator);