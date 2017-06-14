angular.module('production-order')
  .component('productionOrder', {
    bindings: {
      layout: '@',
      flex: '@'
    },
    templateUrl: './components/production_order/production_order.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'CrudHandler', 'ModelProvider',
      function ($scope, $mdDialog, Notifier, CrudHandler, ModelProvider)
      {
        /**
         * This is used for the Notifier module.
         * @type {{created: {module: string, description: string}, deleted: {module: string, description: string, toast: string}, modified: {module: string, description: string}}}
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
          CrudHandler.onLoad(this, pageOptions =>
          {
            const selectionOptions = {};

            // Add associations
            Object.assign(selectionOptions, {
              include: [{
                model: ModelProvider.models.StockCode,
                include: [ModelProvider.models.Operation]
              }, ModelProvider.models.Color, ModelProvider.models.Size, ModelProvider.models.Employee],
              where: {}
            });

            /*
            // Add filters
            if (this.query.employee_type !== 0)
              Object.assign(selectionOptions.where, {
                employee_type: this.query.employee_type
              });

            if (this.query.position_id !== 0)
              Object.assign(selectionOptions.where, {
                position_id: this.query.position_id
              });

            if (this.query.is_active !== 0)
            {
              const isActive = {
                date_hired: {
                  $lte: ModelProvider.Sequelize.fn('CURDATE')
                },
                date_released: {
                  $or: {
                    $gte: ModelProvider.Sequelize.fn('CURDATE'),
                    $eq: null
                  }
                }
              };

              const where = this.query.is_active ? isActive : {
                $not: isActive
              };

              selectionOptions.include.push({
                model: ModelProvider.models.Employment,
                where: where
              });
            }

            if (this.query.has_user_access !== 0)
            {
              const hasNoUserAccess = {
                user_id: null
              };

              const where = this.query.has_user_access ? {
                $not: hasNoUserAccess
              } : hasNoUserAccess;

              Object.assign(selectionOptions.where, where);
            }

            if (this.query.name && this.query.name.length > 0)
              Object.assign(selectionOptions.where, {
                $or: {
                  first_name: {
                    $like: '%' + this.query.name + '%'
                  },
                  middle_name: {
                    $like: '%' + this.query.name + '%'
                  },
                  last_name: {
                    $like: '%' + this.query.name + '%'
                  }
                }
              });
            */

            // Execute the query.
            return Promise.all([
              ModelProvider.models.Production.findAll(Object.assign(pageOptions, selectionOptions)),
              ModelProvider.models.Production.findOne(Object.assign({
                attributes: [[ModelProvider.models.sequelize.fn('COUNT', ModelProvider.models.sequelize.col('*')), 'total_count'],
                  'stock_code_id', 'color_id', 'size_id', 'employee_id']
              }, selectionOptions))
            ]).then(values =>
            {
              return {
                data: values[0],
                total_count: values[1].get('total_count')
              };
            });
          });

          /**
           * Construct the detail view model.
           */
          CrudHandler.onAfterSelectMasterItem(this, () =>
          {
            // Initialize the empty detail view model.
            this.selected_item.detail = this.selected_item.StockCode.Operations.map(operation =>
            {
              return {
                id: operation.id,
                name: operation.name,
                lines: []
              };
            });

            if (this.selected_item.detail.length > 0)
            {
              // Initialize operation 1 header.
              Object.assign(this.selected_item.detail[0], {
                dozen_quantity_remaining: this.selected_item.dozen_quantity,
                piece_quantity_remaining: this.selected_item.piece_quantity,
                lines: [
                  {
                    previous_production_line: {
                      date_finished: null,
                      dozen_quantity: this.selected_item.dozen_quantity,
                      piece_quantity: this.selected_item.piece_quantity,
                      Employee: this.selected_item.Employee
                    },
                    production_lines: []
                  }
                ]
              });
            }
          });

          CrudHandler.onAfterCreateMasterItem(this, () =>
          {
            $mdDialog.show({
              contentElement: '#create-dialog',
              parent: angular.element(document.body)
            });
          });

          /**
           * Validation logic before saving.
           */
          CrudHandler.onBeforeSaveSelectedMasterItem(this, masterItem =>
          {
            if (!masterItem.detail)
              return Promise.resolve();
            
            let operationCounter = 1;
            for (let operation of masterItem.detail)
            {
              if (operation.dozen_quantity_remaining * operation.piece_quantity_remaining < 0)
                return Promise.reject({
                  name: 'Validation Error',
                  message: `Quantity remaining of Operation ${operationCounter}: "${operation.name}" must not be negative.`
                });
              operationCounter++;
            }

            return Promise.resolve();
          });

          CrudHandler.onSaveSelectedMasterItem(this, transaction =>
          {
            let action = 'modified';
            let selectedItem = this.selected_item;
            if (this.selected_item.constructor === Object)
            {
              action = 'created';
              selectedItem.stock_code_id = selectedItem.StockCode.id;
              selectedItem.color_id = selectedItem.Color.id;
              selectedItem.size_id = selectedItem.Size.id;
              selectedItem.employee_id = selectedItem.Employee.id;
              selectedItem = ModelProvider.models.Production.build(selectedItem);
            }

            return Notifier.perform(() =>
              selectedItem.save({
                transaction: transaction
              }).then(productionOrder =>
              {
                let promise = Promise.resolve();
                if(!selectedItem.detail)
                  return Promise.resolve();
                for (let operation of selectedItem.detail)
                  for (let line of operation.lines)
                    for (let productionLine of line.production_lines)
                    {
                      promise = promise.then(() =>
                      {
                        let newProductionLine = productionLine;

                        // Create production line.
                        if (productionLine.constructor === Object)
                        {
                          newProductionLine = Object.assign({
                            parent_id: null,
                            production_id: productionOrder.id,
                            stock_code_id: productionOrder.StockCode.id,
                            pipeline_id: productionOrder.StockCode.pipeline_id,
                            operation_id: operation.id,
                            employee_id: productionLine.Employee.id
                          }, productionLine);

                          newProductionLine = ModelProvider.models.ProductionLine.build(newProductionLine);
                        }

                        return newProductionLine.save({transaction: transaction})
                          .then(parentProductionLine =>
                          {
                            if (productionLine.childLine)
                              for (let childProductionLine of productionLine.childLine.production_lines)
                                childProductionLine.parent_id = parentProductionLine.id;
                          })
                      });
                    }
                return promise;
              }).then(() =>
              {
                this.commands.close();
                return MESSAGE[action];
              }), transaction);
          });

          CrudHandler.onDeleteSelectedMasterItem(this, transaction =>
          {
            if (this.selected_item.constructor === Object)
              return Promise.reject('Cannot delete a new record.');

            return Notifier.perform(() =>
            {
              return this.selected_item.destroy({
                transaction: transaction
              }).catch(error =>
              {
                if (error.name === 'SequelizeForeignKeyConstraintError')
                  return Promise.reject({
                    name: 'Reference Error',
                    message: 'Employee is in used.'
                  });
                return Promise.reject(error);
              }).then(() =>
              {
                this.commands.close();
                return MESSAGE.deleted;
              });
            }, transaction);
          });
        }

        /**
         * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
         */
        CrudHandler.bootstrap(this, $scope);

        /**
         * If environment is production or dev, then auto-load.
         */
        if (process.env.NODE_ENV !== 'test')
          this.commands.load();

        /**
         * Create new production line.
         */
        this.commands.createNewProductionLine = (operation_index, line_index) =>
        {
          // Select the production lines given operation_index and line_index.
          const currentProductionLines = this.selected_item.detail[operation_index].lines[line_index].production_lines;

          // Create new production line.
          const newProductionLine = {
            date_finished: new Date(),
            Employee: null,
            dozen_quantity: 0,
            piece_quantity: 0
          };

          // Add the new production line to the current production lines.
          currentProductionLines.push(newProductionLine);

          // If there is a next operation, execute the following:
          if (this.selected_item.detail[operation_index + 1])
          {
            // Create a new line for the next operation and add a reference of the created production line.
            const newLine = {
              previous_production_line: newProductionLine,
              production_lines: []
            };
            
            // Store a reference of newLine to the newProductionLine.
            newProductionLine.childLine = newLine;

            // Add the new line to the lines of the next operation.
            this.selected_item.detail[operation_index + 1].lines.push(newLine);
            
            // Add watcher for re-computation of quantity remaining on dozen_quantity value changed.
            $scope.$watch(() => newProductionLine.dozen_quantity, () =>
            {
              this.commands.computeQuantityRemaining(this.selected_item.detail[operation_index + 1]);
            });

            // Add watcher for re-computation of quantity remaining on piece_quantity value changed.
            $scope.$watch(() => newProductionLine.piece_quantity, () =>
            {
              this.commands.computeQuantityRemaining(this.selected_item.detail[operation_index + 1]);
            });
          }
        };

        /**
         * Deletes the selected production line but first checks if it is used.
         */
        this.commands.deleteProductionLine = (operation_index, line_index, productionLine, message) =>
        {
          // Select the production lines given operation_index and line_index.
          const currentProductionLines = this.selected_item.detail[operation_index].lines[line_index].production_lines;

          if (productionLine.childLine && productionLine.childLine.production_lines.length > 0)
            return CrudHandler._alert('Restriction', 'You cannot delete a production line in used.');
          else
            return CrudHandler._confirmation(message).then(() => {
              // Deletes the productionLine in the currentProductionLines.
              currentProductionLines.splice(currentProductionLines.indexOf(productionLine), 1);
              // Recompute quantity remaining
              this.commands.computeQuantityRemaining(this.selected_item.detail[operation_index]);
              // Deletes the line in the next operation if there's any and recompute quantity remaining.
              if (this.selected_item.detail[operation_index + 1])
              {
                this.selected_item.detail[operation_index + 1].lines.splice(this.selected_item.detail[operation_index + 1].lines.indexOf(productionLine.childLine), 1);
                this.commands.computeQuantityRemaining(this.selected_item.detail[operation_index + 1]);
              }
            }, () => (0));
        };

        /**
         * Hides the dialog.
         * @returns {Promise}
         */
        this.commands.close = () =>
        {
          return $mdDialog.hide().then(() => this.commands.load());
        };

        /**
         * Opens stock code registry.
         */
        this.commands.openStockCodeRegistry = () =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<stock-code-registry on-dialog-closed="$ctrl.parent.commands.preload()" layout="column"></stock-code-registry>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };

        /**
         * Opens color registry.
         */
        this.commands.openColorRegistry = () =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<color-registry on-dialog-closed="$ctrl.parent.commands.preload()" layout="column"></color-registry>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };

        /**
         * Opens size registry.
         */
        this.commands.openSizeRegistry = () =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<size-registry on-dialog-closed="$ctrl.parent.commands.preload()" layout="column"></size-registry>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
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
              }
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
                }
              }
            });
          }
        };

        /**
         * Computes and updates quantity remaining.
         * @param operation
         */
        this.commands.computeQuantityRemaining = operation =>
        {
          const totalQuantity = operation.lines.reduce(
            (accumulator, line) => accumulator + line.previous_production_line.dozen_quantity * 12 + line.previous_production_line.piece_quantity - line.production_lines.reduce(
              (accumulator, production_line) => accumulator + production_line.dozen_quantity * 12 + production_line.piece_quantity, 0)
            , 0);

          if (!isNaN(totalQuantity))
          {
            operation.dozen_quantity_remaining = Math.floor(totalQuantity / 12);
            operation.piece_quantity_remaining = Math.abs(totalQuantity % 12);
          }
        };
      }]
  });