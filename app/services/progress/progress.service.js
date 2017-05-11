/**
 * [NO TEST]
 * Responsible for toggling the targetObject[targetProperty] for showing/hiding progress bar.
 */
class Progress {

  /**
   * Performs the asynchronous callback and sets the targetObject[targetProperty] to false. After the
   * callback is finished, it sets targetObject[targetProperty] to true.
   * @param targetObject The target object whose property will be modified.
   * @param targetProperty The property of the target object that will be modified.
   * @param callback The asynchronous operation must return a Promise object.
   */
  perform(targetObject, targetProperty, callback)
  {
    targetObject[targetProperty] = false;
    return callback().then(object =>
    {
      targetObject[targetProperty] = true;
      return object;
    });
  }
}

/**
 * Register the Progress service to Angular.
 */
angular.module('progress')
  .service('Progress', Progress);