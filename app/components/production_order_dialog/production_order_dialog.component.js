angular.module('production-order-dialog')
  .component('productionOrderDialog', {
    bindings: {
      layout: '@',
      flex: '@',
      productionOrderLine: '<'
    },
    templateUrl: './components/production_order_dialog/production_order_dialog.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'CrudHandler', 'ModelProvider',
      function ($scope, $mdDialog, Notifier, CrudHandler, ModelProvider)
      {
        this.$onInit = () =>
        {
          /**
           * This is used for the Notifier module.
           */
          const MESSAGE = {
            created: {
              module: 'Production Order',
              description: 'Created a production order successfully!'
            },
            deleted: {
              module: 'Production Order',
              description: 'Deleted a production order successfully!',
              toast: 'Deleted a production order!'
            },
            modified: {
              module: 'Production Order',
              description: 'Modified a production order successfully!'
            }
          };

          /**
           * Life cycles
           */
          {
            CrudHandler.onSaveSelectedMasterItem(this, transaction =>
            {
              let action = 'modified';
              let selectedItem = this.selected_item;
              selectedItem.stock_code_id = selectedItem.StockCode.id;
              selectedItem.color_id = selectedItem.Color.id;
              selectedItem.size_id = selectedItem.Size.id;

              if (selectedItem.constructor === Object)
              {
                selectedItem.ProductionLines = [
                  Object.assign(selectedItem.first_production_line, {
                    stock_code_id: selectedItem.StockCode.id,
                    pipeline_id: selectedItem.StockCode.pipeline_id,
                    operation_id: selectedItem.StockCode.StockCodeOperations[0].operation_id,
                    operation_number: 1,
                    employee_id: selectedItem.first_production_line.Employee.id
                  })
                ];

                selectedItem = ModelProvider.models.Production.build(selectedItem, {
                  include: [ModelProvider.models.ProductionLine]
                });
                action = 'created';
              }

              const options = {
                transaction: transaction
              };

              return Notifier.perform(() =>
                selectedItem.save(options)
                  .then(() => this.productionOrderLine && this.productionOrderLine.save(options))
                  .then(() =>
                  {
                    this.commands.close();
                    return MESSAGE[action];
                  }), transaction);
            });
          }

          CrudHandler.onDeleteSelectedMasterItem(this, transaction =>
          {
            return Notifier.perform(() =>
            {
              const options = {
                transaction: transaction
              };
              return ModelProvider.models.ProductionLine.destroy(Object.assign({
                  where: {
                    production_id: this.selected_item.id
                  }
                }, options)
              ).then(() => this.selected_item.destroy(options))
                .catch(error =>
                {
                  if (error.name === 'SequelizeForeignKeyConstraintError')
                    return Promise.reject({
                      name: 'Reference Error',
                      message: 'This batch already has production lines beyond the first operation.'
                    });
                  return Promise.reject(error);
                }).then(() =>
                {
                  this.commands.close();
                  return MESSAGE.deleted;
                });
            }, transaction);
          });

          /**
           * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
           */
          CrudHandler.bootstrap(this, $scope);

          /**
           * Load an existing production order if exists.
           * @type {string|*|null}
           */
          if (this.productionOrderLine)
            this.selected_item = Object.assign(this.productionOrderLine.Production, {
              first_production_line: this.productionOrderLine
            });

          /**
           * Hides the dialog.
           * @returns {Promise}
           */
          this.commands.close = () =>
          {
            return $mdDialog.hide();
          };

          /**
           * Opens stock code registry.
           */
          this.commands.openStockCodeRegistry = () =>
          {
            $mdDialog.show({
              template: '<md-dialog flex="60">' +
              '<stock-code-registry layout="column"></stock-code-registry>' +
              '</md-dialog>',
              multiple: true,
              locals: {parent: this},
              controller: angular.noop,
              controllerAs: '$ctrl',
              bindToController: true,
              onRemoving: (event, removePromise) => removePromise.then(() => this.commands.preload())
            });
          };

          /**
           * Opens color registry.
           */
          this.commands.openColorRegistry = () =>
          {
            $mdDialog.show({
              template: '<md-dialog flex="60">' +
              '<color-registry layout="column"></color-registry>' +
              '</md-dialog>',
              multiple: true,
              locals: {parent: this},
              controller: angular.noop,
              controllerAs: '$ctrl',
              bindToController: true,
              onRemoving: (event, removePromise) => removePromise.then(() => this.commands.preload())
            });
          };

          /**
           * Opens size registry.
           */
          this.commands.openSizeRegistry = () =>
          {
            $mdDialog.show({
              template: '<md-dialog flex="60">' +
              '<size-registry layout="column"></size-registry>' +
              '</md-dialog>',
              multiple: true,
              locals: {parent: this},
              controller: angular.noop,
              controllerAs: '$ctrl',
              bindToController: true,
              onRemoving: (event, removePromise) => removePromise.then(() => this.commands.preload())
            });
          };

          /**
           * Autocomplete queries.
           */
          this.commands.autocomplete = {
            queryStockCode: query =>
            {
              query = query || '';
              return ModelProvider.models.StockCode.findAll({
                where: {
                  name: {
                    $like: '%' + query + '%'
                  }
                },
                include: [{
                  model: ModelProvider.models.StockCodeOperation,
                  where: {
                    order: 0
                  }
                }]
              });
            },
            queryColor: query =>
            {
              query = query || '';
              return ModelProvider.models.Color.findAll({
                where: {
                  name: {
                    $like: '%' + query + '%'
                  }
                }
              });
            },
            querySize: query =>
            {
              query = query || '';
              return ModelProvider.models.Size.findAll({
                where: {
                  name: {
                    $like: '%' + query + '%'
                  }
                }
              });
            },
            queryEmployee: query =>
            {
              query = query || '';
              return ModelProvider.models.Employee.findAll({
                where: {
                  $or: {
                    first_name: {
                      $like: '%' + query + '%'
                    },
                    middle_name: {
                      $like: '%' + query + '%'
                    },
                    last_name: {
                      $like: '%' + query + '%'
                    }
                  },
                  employee_type: 'Output-based'
                }
              });
            }
          };
        }
      }
    ]
  });