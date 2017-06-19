angular.module('stock-code-registry')
  .component('stockCodeRegistry', {
    bindings: {
      onDialogClosed: '&'
    },
    templateUrl: './components/stock_code_registry/stock_code_registry.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'ModelProvider', 'CustomValidator', 'CrudHandler',
      function ($scope, $mdDialog, Notifier, ModelProvider, CustomValidator, CrudHandler)
      {
        /**
         * This is used for the Notifier module.
         * @type {{created: {module: string, description: string}, deleted: {module: string, description: string, toast: string}, modified: {module: string, description: string}}}
         */
        const MESSAGE = {
          created: {
            module: 'Stock Code Registry',
            description: 'Created a stock code successfully!'
          },
          deleted: {
            module: 'Stock Code Registry',
            description: 'Deleted a stock code successfully!',
            toast: 'Deleted a stock code!'
          },
          modified: {
            module: 'Stock Code Registry',
            description: 'Modified a stock code successfully!'
          }
        };

        /**
         * Lifecycles
         */
        {
          CrudHandler.onSaveSelectedMasterItem(this, transaction =>
          {
            let action = 'modified';
            let selectedStockCode = this.selectedStockCode;
            let previousPipelineId;
            if (this.selectedStockCode.constructor === Object)
            {
              selectedStockCode = ModelProvider.models.StockCode.build(selectedStockCode);
              action = 'created';
            }
            else
              previousPipelineId = selectedStockCode.previous('pipeline_id');

            return Notifier.perform(() =>
              selectedStockCode.save({
                transaction: transaction
              }).then(stockCode =>
                {
                  selectedStockCode = stockCode;
                  // Only delete if pipeline_id is changed, this will trigger the intrinsic checker if stock code is already used.
                  if (this.selectedStockCode.constructor !== Object && this.selectedStockCode.pipeline_id !== previousPipelineId)
                    return ModelProvider.models.StockCodeOperation.destroy({
                      transaction: transaction,
                      where: {
                        stock_code_id: selectedStockCode.id
                      }
                    });
                }
              ).then(() =>
              {
                let promise = Promise.resolve();
                for (let i = 0; i < this.selectedStockCode.Operations.length; i++)
                {
                  const operation = this.selectedStockCode.Operations[i];
                  let instance;
                  if (operation.constructor === Object)
                    instance = ModelProvider.models.StockCodeOperation.build({
                      stock_code_id: selectedStockCode.id,
                      pipeline_id: this.selectedStockCode.pipeline_id,
                      operation_id: operation.id,
                      order: i,
                      price: operation.StockCodeOperation.price
                    });
                  else
                  {
                    instance = operation.StockCodeOperation;
                    instance.order = i;
                  }

                  promise = promise.then(() => instance.save({
                    transaction: transaction
                  }));
                }
                return promise;
              }).catch(error =>
              {
                if (error.name === 'SequelizeForeignKeyConstraintError')
                  return Promise.reject({
                    name: 'Reference Error',
                    message: 'Stock Code is in used.'
                  });
                return Promise.reject(error);
              }).then(() =>
              {
                this.commands.close();
                return MESSAGE[action];
              }), transaction);
          });

          CrudHandler.onDeleteSelectedMasterItem(this, transaction =>
          {
            if (this.selectedStockCode.constructor === Object)
              return Promise.reject('Cannot delete a new record.');

            return Notifier.perform(() =>
            {
              return ModelProvider.models.StockCodeOperation.destroy({
                transaction: transaction,
                where: {
                  stock_code_id: this.selectedStockCode.id
                }
              }).then(() => this.selectedStockCode.destroy({transaction: transaction}))
                .catch(error =>
                {
                  if (error.name === 'SequelizeForeignKeyConstraintError')
                    return Promise.reject({
                      name: 'Reference Error',
                      message: 'Stock code is in used.'
                    });
                  return Promise.reject(error);
                }).then(() =>
                {
                  this.commands.close();
                  return MESSAGE.deleted;
                });
            }, transaction);
          });

          CrudHandler.onPreload(this, transaction => ModelProvider.models.Pipeline.findAll({
            transaction: transaction,
            include: [ModelProvider.models.Operation]
          }).then(pipelines => this.pipelines = pipelines));

          CrudHandler.onLoad(this, pageOptions =>
          {
            let options = {
              transaction: pageOptions.transaction
            };

            Object.assign(options, {
              include: [ModelProvider.models.Operation]
            });

            return ModelProvider.models.StockCode.findAll(options).then(stockCodes =>
            {
              return {
                data: stockCodes
              };
            });
          });

          CrudHandler.onAfterSelectMasterItem(this, selectedItem => selectedItem.Operations = selectedItem.Operations.sort((a, b) => (a.StockCodeOperation.order - b.StockCodeOperation.order) < 0? -1: 1));
        }

        /**
         * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
         */
        CrudHandler.bootstrap(this, $scope, {
          detailProperty: 'Operations',
          selectedMasterItemProperty: 'selectedStockCode',
          message: MESSAGE
        });

        /**
         * If environment is production or dev, then auto-load.
         */
        if (process.env.NODE_ENV !== 'test')
          this.commands.load();

        /**
         * Additional command for dialog.
         */
        /**
         * Hides the dialog.
         * @returns {Promise}
         */
        this.commands.close = () => 
        {
          return $mdDialog.hide().then(() => this.onDialogClosed());
        };

        /**
         * Opens pipeline registry.
         */
        this.commands.openPipelineRegistry = () =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<pipeline-registry on-dialog-closed="$ctrl.parent.commands.preload()" layout="column"></pipeline-registry>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };

        this.commands.selectPipeline = (pipeline_id) =>
        {
          ModelProvider.models.Pipeline.findOne({
            include: [ModelProvider.models.Operation],
            where: {
              id: pipeline_id
            }
          }).then(pipeline => this.selectedStockCode.Operations = pipeline.Operations.sort((a, b) => (a.PipelineOperation.order - b.PipelineOperation.order) < 0? -1: 1));
        }
      }]
  });