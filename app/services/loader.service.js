/**
 * Responsible for transforming the target with a loading animation until its asynchronous operation ends.
 */
class Loader {

  /**
   * Replaces the innerHTML of the target with its loading animation and disables the control.
   * @param target The target HTML control.
   */
  addLoading(target) {
    this.originalHtml = target.innerHTML;
    target.innerHTML = `<i class="fa fa-refresh fa-spin"></i> Loading...`;
    target.disabled = true;
  }

  /**
   * Replaces the innerHTML of the target with its original HTML content and enables the control.
   * @param target The target HTML control.
   */
  removeLoading(target) {
    target.innerHTML = this.originalHtml;
    target.disabled = false;
  }

  /**
   * Performs the asynchronous callback and adds the animation to the target during the operation.
   * @param target The target HTML control.
   * @param callback The asynchronous operation must return a Promise object.
   */
  perform(target, callback) {
    if(!target.disabled)
    {
      this.addLoading(target);
      // This is necessary in order to fulfill the required rendering time of the loading animation
      // before proceeding with the operation.
      setTimeout(() => this.perform(target, callback), 100);
    }
    else
    {
      callback()
        .then(() => this.removeLoading(target))
        .catch(() => this.removeLoading(target));
    }
  }
}

/**
 * Register the Loader service to Angular.
 */
angular.module('loader')
  .service('Loader', Loader);