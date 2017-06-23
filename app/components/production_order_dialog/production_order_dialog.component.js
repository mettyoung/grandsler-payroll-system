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
              toast: 'Deleted a time-shift!'
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
              this.selected_item.stock_code_id = this.selected_item.StockCode.id;
              this.selected_item.color_id = this.selected_item.Color.id;
              this.selected_item.size_id = this.selected_item.Size.id;

              this.selected_item.ProductionLines = [
                Object.assign(this.selected_item.first_production_line, {
                  stock_code_id: this.selected_item.StockCode.id,
                  pipeline_id: this.selected_item.StockCode.pipeline_id,
                  operation_id: this.selected_item.StockCode.StockCodeOperations[0].operation_id,
                  operation_number: 1,
                  employee_id: this.selected_item.first_production_line.Employee.id
                })
              ];

              return Notifier.perform(() =>
                ModelProvider.models.Production.create(this.selected_item, {
                  include: [ModelProvider.models.ProductionLine]
                }, {
                  transaction: transaction
                }).then(() =>
                {
                  this.commands.close();
                  return MESSAGE;
                }), transaction);
            });
          }

          CrudHandler.onDeleteSelectedMasterItem(this, transaction =>
          {
            return Notifier.perform(() =>
            {
              let promise = Promise.resolve();
              for (let timeFrame of this.selectedTimeShift.TimeFrames)
                promise = promise.then(() => timeFrame.destroy({transaction: transaction}));

              promise = promise.then(() =>
                this.selectedTimeShift.destroy({
                  transaction: transaction
                }));

              return promise.catch(error => {
                if (error.name === 'SequelizeForeignKeyConstraintError')
                  return Promise.reject({
                    name: 'Reference Error',
                    message: 'Time-shift is in used.'
                  });
                return Promise.reject(error);
              }).then(() =>
              {
                this.close();
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
            this.selected_item = Object.assign({first_production_line: this.productionOrderLine}, this.productionOrderLine.Production);

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