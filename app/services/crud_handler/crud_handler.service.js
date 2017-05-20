/**
 * A simple CRUD framework.
 */
const process = require('process');

/**
 * Constants
 */
const DEFAULT_OPTIONS = {
  masterProperty: 'masterItems',
  detailProperty: 'Details',
  selectedMasterItemProperty: 'masterItem',
  disableDeleteButtonProperty: 'disableDeleteButton',
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
  }
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
    this._lifeCycles = {};
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
     * Initialize internal properties.
     */
    this._controller = controller;
    this._$scope = $scope;
    this._options = Object.assign({}, DEFAULT_OPTIONS, options);

    /**
     * Used to only allow one delete/save at a time.
     * @type {boolean}
     */
    this._isWriteIdle = true;

    // Initialize view models.
    this._controller[this._options.masterProperty] = [];
    this._controller[this._options.selectedMasterItemProperty] = null;
    this._controller[this._options.disableDeleteButtonProperty] = true;

    // Initialize commands
    this.setCommands();
  }

  /**
   * Initializes commands.
   */
  setCommands()
  {
    /**
     * Creates a new item to the master list.
     * @LifeCycle: onAfterCreateMasterItem.
     */
    this._controller.createMasterItem = () =>
    {
      this._controller[this._options.disableDeleteButtonProperty] = true;
      this._controller[this._options.selectedMasterItemProperty] = {
        [this._options.detailProperty]: []
      };
      this._lifeCycles.onAfterCreateMasterItem && this._lifeCycles.onAfterCreateMasterItem();
    };

    /**
     * Selects an item from the master list.
     * @param masterItem the masterItem to be selected.
     * @param transaction
     * @returns {Promise}
     */
    this._controller.selectMasterItem = (masterItem, transaction) =>
    {
      return masterItem.reload({transaction: transaction})
        .then(() =>
        {
          this._controller[this._options.disableDeleteButtonProperty] = false;
          this._controller[this._options.selectedMasterItemProperty] = masterItem;
          this._$scope.$apply();
        });
    };

    /**
     * Creates a detail item under the selected master item.
     */
    this._controller.createDetailItem = () => this._controller[this._options.selectedMasterItemProperty][this._options.detailProperty].push({});

    /**
     * Saves the selected master item including its details.
     * @param transaction
     * @LifeCycle: onBeforeSaveSelectedMasterItem and onSaveSelectedMasterItem
     */
    this._controller.saveSelectedMasterItem = transaction => this._write(transaction, 'save');

    /**
     * Deletes the selected master item including its details.
     * @param transactionOrMessage If this parameter is a string, then it will ask for confirmation before deleting.
     * @returns {Promise}
     * @LifeCycle: onBeforeDeleteSelectedMasterItem and onDeleteSelectedMasterItem
     */
    this._controller.deleteSelectedMasterItem = (transactionOrMessage) =>
    {
      let promise = Promise.resolve();
      let transaction;
      if (typeof transactionOrMessage === 'string')
        promise = this._confirmation(transactionOrMessage);
      else
        transaction = transactionOrMessage;

      return promise.then(() => this._write(transaction, 'delete'), () => (0));
    };

    /**
     * Delete detail item from the detail list under the selected master item.
     * @param detailItem
     * @param message
     * @returns {Promise}
     */
    this._controller.deleteDetailItem = (detailItem, message) =>
    {
      let promise = Promise.resolve();
      if (typeof message === 'string')
        promise = this._confirmation(message);

      return promise.then(() => this._controller[this._options.selectedMasterItemProperty][this._options.detailProperty]
        .splice(this._controller[this._options.selectedMasterItemProperty][this._options.detailProperty].indexOf(detailItem), 1),
        () => (0));
    };

    /**
     * Load master-detail data from the database.
     * @param transaction
     */
    this._controller.load = transaction =>
    this._lifeCycles.onLoad && this._lifeCycles.onLoad(transaction)
      .then(masterList =>
      {
        if (masterList.length > 0)
        {
          this._controller[this._options.selectedMasterItemProperty] = masterList[0];
          this._controller[this._options.disableDeleteButtonProperty] = false;
        }
      })
      .catch(error => this._controller.load_error = error)
      .then(() => this._$scope.$apply());


    /**
     * Preload the component.
     */
    /**
     * If environment is not production or dev, then preload the module.
     */
    if (process.env.NODE_ENV !== 'test')
      this._controller.load();
  }

  onAfterCreateMasterItem(onAfterCreateMasterItem)
  {
    this._lifeCycles.onAfterCreateMasterItem = onAfterCreateMasterItem;
  }

  onBeforeSaveSelectedMasterItem(onBeforeSaveSelectedMasterItem)
  {
    this._lifeCycles.onBeforeSaveSelectedMasterItem = onBeforeSaveSelectedMasterItem;
  }

  onSaveSelectedMasterItem(onSaveSelectedMasterItem)
  {
    this._lifeCycles.onSaveSelectedMasterItem = onSaveSelectedMasterItem;
  }

  onBeforeDeleteSelectedMasterItem(onBeforeDeleteSelectedMasterItem)
  {
    this._lifeCycles.onBeforeDeleteSelectedMasterItem = onBeforeDeleteSelectedMasterItem;
  }

  onDeleteSelectedMasterItem(onDeleteSelectedMasterItem)
  {
    this._lifeCycles.onDeleteSelectedMasterItem = onDeleteSelectedMasterItem;
  }

  onLoad(onLoad)
  {
    this._lifeCycles.onLoad = onLoad;
  }

  /**
   * Refactored code for delete and upsert.
   * @param transaction
   * @param operation
   * @returns {*}
   * @private
   */
  _write(transaction, operation)
  {
    if (this._isWriteIdle)
    {
      this._isWriteIdle = false;

      // Initialization
      const event = this._lifeCycles[OPERATIONS[operation].event];
      const onBeforeEvent = this._lifeCycles[OPERATIONS[operation].onBeforeEvent];
      const selectedMaster = this._controller[this._options.selectedMasterItemProperty];

      // Execute onBeforeEvent.
      const onBeforePromise = onBeforeEvent ? onBeforeEvent(selectedMaster) : Promise.resolve();

      let transactionPromise;
      if (transaction)
        transactionPromise = onBeforePromise.then(() => event(transaction));
      else
        transactionPromise = onBeforePromise.then(() => this._ModelProvider.sequelize.transaction(event));

      return transactionPromise.then(() => this._controller.write_error = null)
        .catch(error => this._controller.write_error = error)
        .then(() => this._$scope.$apply())
        .then(() => this._isWriteIdle = true);
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
}

angular.module('crud-handler')
  .service('CrudHandler', ['ModelProvider', '$mdDialog', CrudHandler]);