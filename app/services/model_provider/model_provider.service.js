/**
 * [NO TEST]
 * Responsible for holding the models object. This can be used to modify the models with mocks.
 */
class ModelProvider {

  /**
   * Preload the models with Sequelize models.
   */
  constructor()
  {
    this.load();
  }

  /**
   * Loads the models with Sequelize models.
   */
  load()
  {
    this.models = require('../../models/persistence/index');
    this.sequelize = this.models.sequelize;
  }
}

/**
 * Register the ModelProvider service to Angular.
 */
angular.module('model-provider')
  .service('ModelProvider', ModelProvider);