/**
 * A simple CRUD framework.
 */
const process = require('process');

/**
 * View Models
 * - load_error
 * - write_error
 * - detail_load_error
 * - is_delete_disabled
 * - Form
 * - [selected_item]
 * - preset {limitOptions}
 * - data {[items.[details], progress, total_count}
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
  detailProperty: 'details',
  selectedMasterItemProperty: 'selected_item',
  formProperty: 'Form',
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

    return controller.commands.preload();
  }

  /**
   * Initializes view models.
   * @param controller
   * @private
   */
  _setViewModels(controller)
  {
    const options = controller._options;
    controller[options.selectedMasterItemProperty] = {
      [options.detailProperty]: []
    };
    controller.is_delete_disabled = true;

    /**
     * Set auth service.
     * @type {null|*}
     */
    controller.auth = this._ModelProvider.auth;
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
        const masterItem = controller[options.selectedMasterItemProperty] = {
          [options.detailProperty]: []
        };
        controller.detail_load_error = controller.write_error = null;

        // Set it to untouched to reset validations.
        controller[options.formProperty] && controller[options.formProperty].$setUntouched();
        controller._lifeCycles.onAfterCreateMasterItem && controller._lifeCycles.onAfterCreateMasterItem(masterItem);
      },

      /**
       * Selects an item from the master list.
       * @param masterItem the masterItem to be selected.
       * @param transaction
       * @LifeCycle: onAfterSelectMasterItem.
       * @returns {Promise}
       */
      selectMasterItem(masterItem, transaction)
      {
        let promise = Promise.resolve();
        if (masterItem)
          promise = promise.then(() =>
            masterItem.reload({transaction: transaction})
              .then(item =>
              {
                controller.is_delete_disabled = false;
                controller.detail_load_error = controller.write_error = null;
                controller[options.selectedMasterItemProperty] = item;
              })
              .catch(error =>
              {
                controller.detail_load_error = error;
                controller.is_delete_disabled = true;
              })
              .then(() => controller._lifeCycles.onAfterSelectMasterItem && controller._lifeCycles.onAfterSelectMasterItem(masterItem, transaction))
              .then(() => controller._$scope.$apply()));

        return promise;
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
        return self._write(controller, transaction, 'save').then(() =>
        {
          // If save is successful, set the selected item to null.
          if (!controller.write_error)
            controller[options.selectedMasterItemProperty] = null;
        });
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

        return promise.then(() => self._write(controller, transaction, 'delete')
          .then(() =>
          {
            // If delete is successful, set the selected item to null.
            if (!controller.write_error)
              controller[options.selectedMasterItemProperty] = null;
          }), () => (0));
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

        return promise.then(() =>
          {
            controller[options.selectedMasterItemProperty][options.detailProperty]
              .splice(controller[options.selectedMasterItemProperty][options.detailProperty].indexOf(detailItem), 1);
            controller._lifeCycles.onAfterDeleteDetailItem && controller._lifeCycles.onAfterDeleteDetailItem(detailItem);
          }, () => (0));
      },

      /**
       * Load master-detail data from the database.
       * @param transaction
       */
      load(transaction)
      {
        const pageOptions = self._getPaginationQuery(controller.query);

        if (transaction && transaction.sequelize)
          Object.assign(pageOptions, {
            transaction: transaction
          });

        return controller.data.progress = controller._lifeCycles.onLoad &&
          controller._lifeCycles.onLoad(pageOptions)
            .then(result =>
            {
              controller.data.selected = result.data;
              controller.data.total_count = result.total_count;
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
  }

  onAfterCreateMasterItem(controller, onAfterCreateMasterItem)
  {
    if (!controller._lifeCycles)
      controller._lifeCycles = {};
    controller._lifeCycles.onAfterCreateMasterItem = onAfterCreateMasterItem;
  }

  onAfterSelectMasterItem(controller, onAfterSelectMasterItem)
  {
    if (!controller._lifeCycles)
      controller._lifeCycles = {};
    controller._lifeCycles.onAfterSelectMasterItem = onAfterSelectMasterItem;
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

  onAfterDeleteDetailItem(controller, onAfterDeleteDetailItem)
  {
    if (!controller._lifeCycles)
      controller._lifeCycles = {};
    controller._lifeCycles.onAfterDeleteDetailItem = onAfterDeleteDetailItem;
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

  /**
   * Creates an alert message box.
   * @param message
   * @private
   */
  _alert(title, message)
  {
    let alertDialog = this._$mdDialog.alert()
      .title(title)
      .textContent(message)
      .ok('Okay');

    alertDialog._options.multiple = true;

    return this._$mdDialog.show(alertDialog);
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