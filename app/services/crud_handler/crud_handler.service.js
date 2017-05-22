/**
 * A simple CRUD framework.
 */
const process = require('process');

/**
 * View Models
 * - load_error
 * - write_error
 * - is_delete_disabled
 * - [items.[details]]
 * - [selected_item]
 * - preset {limitOptions}
 * - data {selected, progress, total_count}
 * - query {order, limit, page}
 *
 * Commands
 * - createMasterItem
 * - selectMasterItem
 * - createDetailItem
 * - saveSelectedMasterItem
 * - deleteSelectedMasterItem
 * - deleteDetailItem
 * - load
 */

/**
 * Constants
 */
const DEFAULT_OPTIONS = {
  masterProperty: 'items',
  detailProperty: 'details',
  selectedMasterItemProperty: 'selected_item',
  message: {
    created: {
      module: 'Module',
      description: 'Created an entry successfully!'
    },
    deleted: {
      module: 'Module',
      description: 'Deleted an entry successfully!'
    },
    modified: {
      module: 'Module',
      description: 'Modified an entry successfully!'
    }
  },
  limitOptions: [5, 10, 15],
  order: 'id',
  limit: 10,
  page: 1
};
const OPERATIONS = {
  delete: {
    event: 'onDeleteSelectedMasterItem',
    onBeforeEvent: 'onBeforeDeleteSelectedMasterItem'
  },
  save: {
    event: 'onSaveSelectedMasterItem',
    onBeforeEvent: 'onBeforeSaveSelectedMasterItem'
  }
};

/**
 * Handles master-detail CRUD with lifecycle listeners.
 */
class CrudHandler {

  /**
   * Model Provider and $mdDialog are injected for creating transactions and creating confirmation dialogs respectively.
   * @param ModelProvider
   * @param $mdDialog
   */
  constructor(ModelProvider, $mdDialog)
  {
    this._ModelProvider = ModelProvider;
    this._$mdDialog = $mdDialog;
  }

  /**
   * Bootstraps the controller and takes in the $scope, $mdDialog and a customized option object.
   * @param controller View models and commands will be initialized to the controller.
   * @param $scope
   * @param options
   */
  bootstrap(controller, $scope, options)
  {
    /**
     * Embedded $scope and processed options to controller.
     */
    controller._$scope = $scope;
    controller._options = Object.assign({}, DEFAULT_OPTIONS, options);

    /**
     * Initialize life cycles object if not existing.
     */
    if (!controller._lifeCycles)
      controller._lifeCycles = {};

    /**
     * Used to only allow one delete/save at a time.
     * @type {boolean}
     */
    controller._isWriteIdle = true;

    // Initialize view models.
    this._setViewModels(controller);
    // Initialize commands
    this._setCommands(controller);
  }

  /**
   * Initializes view models.
   * @param controller
   * @private
   */
  _setViewModels(controller)
  {
    const options = controller._options;
    controller[options.masterProperty] = [];
    controller[options.selectedMasterItemProperty] = null;
    controller.is_delete_disabled = true;

    /**
     * Set the limit options of the pagination.
     * @type {{limitOptions: number[]}}
     */
    controller.preset = {
      limitOptions: options.limitOptions
    };

    /**
     * Initialize the default data object structure.
     * @type {{selected: Array, progress: null, total_count: number}}
     */
    controller.data = {
      selected: [],
      progress: null,
      total_count: 0
    };

    /**
     * Initialize default query options
     * @type {{order: string, limit: number, page: number, initialize: (function())}}
     */
    controller.query = {
      order: options.order,
      limit: options.limit,
      page: options.page
    };
  }

  /**
   * Initializes commands.
   */
  _setCommands(controller)
  {
    const options = controller._options;
    const self = this;

    /**
     * Collect all commands into an object.
     */
    controller.commands = {
      /**
       * Creates a new item to the master list.
       * @LifeCycle: onAfterCreateMasterItem.
       */
      createMasterItem()
      {
        controller.is_delete_disabled = true;
        controller[options.selectedMasterItemProperty] = {
          [options.detailProperty]: []
        };
        controller._lifeCycles.onAfterCreateMasterItem && controller._lifeCycles.onAfterCreateMasterItem();
      },

      /**
       * Selects an item from the master list.
       * @param masterItem the masterItem to be selected.
       * @param transaction
       * @returns {Promise}
       */
      selectMasterItem(masterItem, transaction)
      {
        return masterItem.reload({transaction: transaction})
          .then(() =>
          {
            controller.is_delete_disabled = false;
            controller[options.selectedMasterItemProperty] = masterItem;
            controller._$scope.$apply();
          });
      },

      /**
       * Creates a detail item under the selected master item.
       */
      createDetailItem()
      {
        return controller[options.selectedMasterItemProperty][options.detailProperty].push({});
      },

      /**
       * Saves the selected master item including its details.
       * @param transaction
       * @LifeCycle: onBeforeSaveSelectedMasterItem and onSaveSelectedMasterItem
       */
      saveSelectedMasterItem(transaction)
      {
        return self._write(controller, transaction, 'save');
      },

      /**
       * Deletes the selected master item including its details.
       * @param transactionOrMessage If this parameter is a string, then it will ask for confirmation before deleting.
       * @returns {Promise}
       * @LifeCycle: onBeforeDeleteSelectedMasterItem and onDeleteSelectedMasterItem
       */
      deleteSelectedMasterItem(transactionOrMessage)
      {
        let promise = Promise.resolve();
        let transaction;
        if (typeof transactionOrMessage === 'string')
          promise = self._confirmation(transactionOrMessage);
        else
          transaction = transactionOrMessage;

        return promise.then(() => self._write(controller, transaction, 'delete'), () => (0));
      },

      /**
       * Delete detail item from the detail list under the selected master item.
       * @param detailItem
       * @param message
       * @returns {Promise}
       */
      deleteDetailItem(detailItem, message)
      {
        let promise = Promise.resolve();
        if (typeof message === 'string')
          promise = self._confirmation(message);

        return promise.then(() => controller[options.selectedMasterItemProperty][options.detailProperty]
            .splice(controller[options.selectedMasterItemProperty][options.detailProperty].indexOf(detailItem), 1),
          () => (0));
      },

      /**
       * Load master-detail data from the database.
       * @param transaction
       */
      load(transaction)
      {
        const queryOptions = self._getPaginationQuery(controller.query);

        if (transaction && transaction.sequelize)
          Object.assign(queryOptions, {
            transaction: transaction
          });

        return controller.data.progress = controller._lifeCycles.onLoad &&
          controller._lifeCycles.onLoad(queryOptions)
            .then(result =>
            {
              controller.data.selected = result.data;
              controller.data.total_count = result.total_count;
              controller[options.masterProperty] = result.data;
              if (result.data.length > 0)
              {
                controller[options.selectedMasterItemProperty] = result.data[0];
                controller.is_delete_disabled = false;
              }
            })
            .catch(error => controller.load_error = error)
            .then(() => controller._$scope.$apply());
      },

      /**
       * Pre-loads data from the database; runs only once upon bootstrap call.
       * @param transaction
       * @returns {Promise}
       */
      preload(transaction)
      {
        return controller._lifeCycles.onPreload && controller._lifeCycles.onPreload(transaction)
            .catch(error => controller.load_error = error)
            .then(() => controller._$scope.$apply());
      }
    };

    controller.commands.preload();
  }

  onAfterCreateMasterItem(controller, onAfterCreateMasterItem)
  {
    if (!controller._lifeCycles)
      controller._lifeCycles = {};
    controller._lifeCycles.onAfterCreateMasterItem = onAfterCreateMasterItem;
  }

  onBeforeSaveSelectedMasterItem(controller, onBeforeSaveSelectedMasterItem)
  {
    if (!controller._lifeCycles)
      controller._lifeCycles = {};
    controller._lifeCycles.onBeforeSaveSelectedMasterItem = onBeforeSaveSelectedMasterItem;
  }

  onSaveSelectedMasterItem(controller, onSaveSelectedMasterItem)
  {
    if (!controller._lifeCycles)
      controller._lifeCycles = {};
    controller._lifeCycles.onSaveSelectedMasterItem = onSaveSelectedMasterItem;
  }

  onBeforeDeleteSelectedMasterItem(controller, onBeforeDeleteSelectedMasterItem)
  {
    if (!controller._lifeCycles)
      controller._lifeCycles = {};
    controller._lifeCycles.onBeforeDeleteSelectedMasterItem = onBeforeDeleteSelectedMasterItem;
  }

  onDeleteSelectedMasterItem(controller, onDeleteSelectedMasterItem)
  {
    if (!controller._lifeCycles)
      controller._lifeCycles = {};
    controller._lifeCycles.onDeleteSelectedMasterItem = onDeleteSelectedMasterItem;
  }

  onLoad(controller, onLoad)
  {
    if (!controller._lifeCycles)
      controller._lifeCycles = {};
    controller._lifeCycles.onLoad = onLoad;
  }

  onPreload(controller, onPreload)
  {
    if (!controller._lifeCycles)
      controller._lifeCycles = {};
    controller._lifeCycles.onPreload = onPreload;
  }

  /**
   * Refactored code for delete and upsert.
   * @param transaction
   * @param operation
   * @returns {*}
   * @private
   */
  _write(controller, transaction, operation)
  {
    const options = controller._options;
    if (controller._isWriteIdle)
    {
      controller._isWriteIdle = false;

      // Initialization
      const event = controller._lifeCycles[OPERATIONS[operation].event];
      const onBeforeEvent = controller._lifeCycles[OPERATIONS[operation].onBeforeEvent];
      const selectedMaster = controller[options.selectedMasterItemProperty];

      // Execute onBeforeEvent.
      const onBeforePromise = onBeforeEvent ? onBeforeEvent(selectedMaster) : Promise.resolve();

      let transactionPromise;
      if (transaction)
        transactionPromise = onBeforePromise.then(() => event(transaction));
      else
        transactionPromise = onBeforePromise.then(() => this._ModelProvider.sequelize.transaction(event));

      return transactionPromise.then(() => controller.write_error = null)
        .catch(error => controller.write_error = error)
        .then(() => controller._$scope.$apply())
        .then(() => controller._isWriteIdle = true);
    }
  }

  /**
   * Creates a confirmation message box.
   */
  _confirmation(message)
  {
    let confirmationDialog = this._$mdDialog.confirm()
      .title('Confirmation')
      .textContent(message)
      .ariaLabel('Confirmation')
      .ok('Yes')
      .cancel('No');
    confirmationDialog._options.multiple = true;

    return this._$mdDialog.show(confirmationDialog);
  }

  _getPaginationQuery(query)
  {
    // Extract column name with direction
    let directionToken = query.order.split('-');
    let orderBy = directionToken.pop();
    let direction = directionToken.length > 0 ? 'DESC' : 'ASC';

    // Get the N-1 tokens as association tokens.
    let associationTokens = orderBy.split('.');
    // Take the last token as the column name.
    let columnName = associationTokens.pop();

    let associations = associationTokens.map(token =>
    {
      return this._ModelProvider.models[token];
    });

    return {
      order: [[...associations, columnName, direction]],
      limit: query.limit,
      offset: query.limit * (query.page - 1)
    };
  }
}

angular.module('crud-handler')
  .service('CrudHandler', ['ModelProvider', '$mdDialog', CrudHandler]);