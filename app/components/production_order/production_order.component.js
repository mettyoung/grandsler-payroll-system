angular.module('production-order')
  .component('productionOrder', {
    bindings: {
      layout: '@',
      flex: '@'
    },
    templateUrl: './components/production_order/production_order.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'CrudHandler', 'ModelProvider', 'hotkeys',
      function ($scope, $mdDialog, Notifier, CrudHandler, ModelProvider, hotkeys)
      {
        /**
         * This is used for the Notifier module.
         * @type {{deleted: {module: string, description: string, toast: string}, modified: {module: string, description: string}}}
         */
        const MESSAGE = {
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
          CrudHandler.onPreload(this, transaction => Promise.all([
              ModelProvider.models.StockCode.findAll({
                transaction: transaction
              }),
              ModelProvider.models.Color.findAll({
                transaction: transaction
              }),
              ModelProvider.models.Size.findAll({
                transaction: transaction
              }),
              ModelProvider.models.PipelineOperation.findOne({
                transaction: transaction,
                group: ['pipeline_id'],
                attributes: [[ModelProvider.sequelize.fn('COUNT', ModelProvider.sequelize.col('*')), 'total_count']],
                order: [[ModelProvider.sequelize.col('total_count'), 'DESC']]
              })
            ]).then(values =>
            {
              [this.data.stock_codes, this.data.colors, this.data.sizes] = values;
              const numberOfOperations = values[3] && values[3].get('total_count') || 0;
              this.data.operation_numbers = [...new Array(numberOfOperations).keys()].map(value => value + 1);
            })
          );

          CrudHandler.onLoad(this, pageOptions =>
          {
            /**
             * We have to separate two queries since it is impossible to eager load hasMany associations while 
             * creating a selection based on other joined tables and paginating. Hence, there are two association objects.
             * One to be used for the selection. The other is used for the projection.
             */
            const selectionAssociations = [
              ModelProvider.models.Employee,
              {
                model: ModelProvider.models.ProductionLine,
                include: [ModelProvider.models.Employee]
              }];

            const projectionAssociations = [
              ModelProvider.models.Employee,
              {
                model: ModelProvider.models.StockCode,
                include: [ModelProvider.models.Operation]
              },
              ModelProvider.models.Color, ModelProvider.models.Size,
              {
                model: ModelProvider.models.ProductionLine,
                include: [ModelProvider.models.Employee]
              }];

            const selectionOptions = {};
            // Add selection associations
            Object.assign(selectionOptions, {
              include: selectionAssociations,
              where: {},
              group: ['Production.id', 'ProductionLines.production_id'],
              order: ['id'],
              subQuery: false
            });

            // Add filters
            if (this.query.employee_name && this.query.employee_name.length > 0)
              Object.assign(selectionOptions.where, {
                $or: [
                  ModelProvider.Sequelize.literal(`\`Employee\`.first_name LIKE '%${this.query.employee_name}%'`),
                  ModelProvider.Sequelize.literal(`\`Employee\`.middle_name LIKE '%${this.query.employee_name}%'`),
                  ModelProvider.Sequelize.literal(`\`Employee\`.last_name LIKE '%${this.query.employee_name}%'`),
                  ModelProvider.Sequelize.literal(`\`ProductionLines.Employee\`.first_name LIKE '%${this.query.employee_name}%'`),
                  ModelProvider.Sequelize.literal(`\`ProductionLines.Employee\`.middle_name LIKE '%${this.query.employee_name}%'`),
                  ModelProvider.Sequelize.literal(`\`ProductionLines.Employee\`.last_name LIKE '%${this.query.employee_name}%'`)
                ]
              });

            if (this.query.stock_code_id !== 0)
              Object.assign(selectionOptions.where, {
                stock_code_id: this.query.stock_code_id
              });

            if (this.query.color_id !== 0)
              Object.assign(selectionOptions.where, {
                color_id: this.query.color_id
              });

            if (this.query.size_id !== 0)
              Object.assign(selectionOptions.where, {
                size_id: this.query.size_id
              });

            if (this.query.is_finished !== 0)
              Object.assign(selectionOptions.where, {
                is_finished: this.query.is_finished
              });

            this.data.show_progress_bar = true;

            // Execute the query.
            return ModelProvider.models.Production.findAndCountAll(Object.assign(pageOptions, selectionOptions))
              .then(result =>
              {
                const production_ids = result.rows.map(row => row.id);

                return ModelProvider.models.Production.findAll({
                  include: projectionAssociations,
                  where: {
                    id: production_ids
                  }
                }).then(productions =>
                {
                    this.data.show_progress_bar = false;
                    return {
                      data: productions,
                      total_count: result.count.length
                    };
                })
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

            // Create operation indexer.
            const operation_indexer = {};
            for (let i = 0; i < this.selected_item.detail.length; i++)
              operation_indexer[this.selected_item.detail[i].id] = i;

            if (this.selected_item.detail.length > 0)
            {
              // Initialize operation 1 header.
              Object.assign(this.selected_item.detail[0], {
                dozen_quantity_remaining: this.selected_item.dozen_quantity,
                piece_quantity_remaining: this.selected_item.piece_quantity,
                lines: [
                  {
                    previous_production_line: {
                      id: null,
                      date_finished: null,
                      dozen_quantity: this.selected_item.dozen_quantity,
                      piece_quantity: this.selected_item.piece_quantity,
                      Employee: this.selected_item.Employee
                    },
                    production_lines: []
                  }
                ]
              });

              // Load detail from database.
              for (let productionLine of this.selected_item.ProductionLines)
              {
                // Find the selected lines given operation_id.
                const selectedLines = this.selected_item.detail[operation_indexer[productionLine.operation_id]].lines;

                // Find the selected line by matching productionLine's previous production line.
                let existingLine;
                for (let line of selectedLines)
                  if (line.previous_production_line.id === productionLine.parent_id)
                    existingLine = line;

                if (existingLine)
                  existingLine.production_lines.push(productionLine);
                else
                // Store a reference of the UI-exposed production line to previous_production_line.
                  selectedLines.push({
                    previous_production_line: this.selected_item.ProductionLines.filter(element => element.id === productionLine.parent_id)[0],
                    production_lines: [productionLine]
                  });

                // Add child line if there's a next operation.
                addChildLine(this.selected_item.detail[operation_indexer[productionLine.operation_id] + 1], productionLine);
              }

              // Compute quantity remaining on load.
              this.commands.computeQuantityRemaining();
            }
            $scope.$apply();
          });

          /**
           * Validation logic before saving.
           */
          CrudHandler.onBeforeSaveSelectedMasterItem(this, masterItem =>
          {
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
            return Notifier.perform(() =>
              this.selected_item.save({
                transaction: transaction
              }).then(productionOrder =>
              {
                let promise = ModelProvider.sequelize.query('DELETE FROM production_lines WHERE production_id = ? ORDER BY id DESC', {
                  replacements: [productionOrder.id],
                  type: ModelProvider.sequelize.QueryTypes.DELETE,
                  transaction: transaction
                });

                for (let operation of this.selected_item.detail)
                  for (let line of operation.lines)
                    for (let productionLine of line.production_lines)
                    {
                      promise = promise.then(() =>
                      {
                        let newProductionLine = productionLine;
                        if (productionLine.constructor !== Object)
                          newProductionLine = productionLine.get({plain: true});
                        newProductionLine.employee_id = productionLine.Employee.id;

                        newProductionLine = Object.assign({
                          parent_id: null,
                          production_id: productionOrder.id,
                          stock_code_id: productionOrder.StockCode.id,
                          pipeline_id: productionOrder.StockCode.pipeline_id,
                          operation_id: operation.id
                        }, newProductionLine);

                        newProductionLine = ModelProvider.models.ProductionLine.build(newProductionLine);

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
              }).then(() => MESSAGE.modified), transaction);
          });

          CrudHandler.onDeleteSelectedMasterItem(this, transaction =>
          {
            if (this.selected_item.constructor === Object)
              return Promise.reject('Cannot delete a new record.');

            return Notifier.perform(() =>
            {
              return ModelProvider.sequelize.query('DELETE FROM production_lines WHERE production_id = ? ORDER BY id DESC', {
                replacements: [this.selected_item.id],
                type: ModelProvider.sequelize.QueryTypes.DELETE,
                transaction: transaction
              }).then(() => this.selected_item.destroy({transaction: transaction}))
                .catch(error =>
                {
                  if (error.name === 'SequelizeForeignKeyConstraintError')
                    return Promise.reject({
                      name: 'Reference Error',
                      message: 'Production Order is in used.'
                    });
                  return Promise.reject(error);
                }).then(() => MESSAGE.deleted);
            }, transaction);
          });
        }

        /**
         * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
         */
        CrudHandler.bootstrap(this, $scope).then(() =>
        {
          /**
           * If environment is production or dev, then auto-load.
           */
          if (process.env.NODE_ENV !== 'test')
            this.commands.load();
        });

        /**
         * Initialize selected_item to null.
         */
        this.selected_item = null;

        /**
         * Override createMasterItem.
         */
        this.commands.createMasterItem = () =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<production-order-dialog on-dialog-closed="$ctrl.parent.commands.preload() && $ctrl.parent.commands.load()" layout="column"></production-order-dialog>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };

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

          // Add child line if there's a next operation.
          addChildLine(this.selected_item.detail[operation_index + 1], newProductionLine);
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
            return CrudHandler._confirmation(message).then(() =>
            {
              // Deletes the productionLine in the currentProductionLines.
              currentProductionLines.splice(currentProductionLines.indexOf(productionLine), 1);

              // Deletes the line in the next operation if there's any and recompute quantity remaining.
              if (this.selected_item.detail[operation_index + 1])
                this.selected_item.detail[operation_index + 1].lines.splice(this.selected_item.detail[operation_index + 1].lines.indexOf(productionLine.childLine), 1);

              // Recompute quantity remaining on delete.
              this.commands.computeQuantityRemaining();
            }, () => (0));
        };

        /**
         * Mark finished the production order.
         * @param productionOrder
         * @returns {*}
         */
        this.commands.markFinished = productionOrder =>
        {
          const message = `You won't be able modify the production order lines anymore. Are you sure you want to proceed?`;

          if (this._isWriteIdle)
          {
            this._isWriteIdle = false;
            return CrudHandler._confirmation(message).then(() =>
            {
              productionOrder.is_finished = true;
              return productionOrder.save()
                .catch(error => this.write_error = error)
                .then(() => $scope.$apply())
            }, () => (0))
              .then(() => this._isWriteIdle = true);
          }
        };

        /**
         * Autocomplete queries.
         */
        this.commands.autocomplete = {
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

        /**
         * Computes and updates quantity remaining of all operations of the selected_item.
         */
        this.commands.computeQuantityRemaining = () =>
        {
          for (let operation of this.selected_item.detail)
          {
            const totalQuantity = operation.lines.reduce(
              (accumulator, line) => accumulator + line.previous_production_line.dozen_quantity * 12 + line.previous_production_line.piece_quantity - line.production_lines.reduce(
                (accumulator, production_line) => accumulator + production_line.dozen_quantity * 12 + production_line.piece_quantity, 0)
              , 0);

            if (!isNaN(totalQuantity))
            {
              operation.dozen_quantity_remaining = Math.floor(totalQuantity / 12);
              operation.piece_quantity_remaining = Math.abs(totalQuantity % 12);

              for (let line of operation.lines)
              {
                const expected = line.previous_production_line.dozen_quantity * 12 + line.previous_production_line.piece_quantity;
                const actual = line.production_lines.reduce(
                  (accumulator, production_line) => accumulator + production_line.dozen_quantity * 12 + production_line.piece_quantity, 0);
                line.progress = actual / expected * 100;
              }
            }
          }
        };

        /**
         * Add child line to the productionLine if there is a next operation.
         */
        function addChildLine(nextOperation, productionLine)
        {
          // If there is a next operation, create a new line and save the previous production line reference to the productionLine:
          if (nextOperation)
          {
            // Create a new line for the next operation and add a reference of the created production line.
            const newLine = {
              previous_production_line: productionLine,
              production_lines: []
            };

            // Store a reference of newLine to the productionLine.
            productionLine.childLine = newLine;

            // Add the new line to the lines of the next operation.
            nextOperation.lines.push(newLine);
          }
        }

        /**
         * Add hotkeys
         */
        const hotkeysDictionary = hotkeys.bindTo($scope)
          .add({
            combo: 'ctrl+c',
            description: 'Creates a new production order.',
            callback: (event, hotkey) =>
            {
              this.commands.createMasterItem();
            }
          })
          .add({
            combo: `ctrl+0`,
            description: `Show all operations.`,
            callback: (event, hotkey) => this.query.operation_number = 0
          });

        const addOperationHotkeys = hotkeysDictionary =>
        {
          for (let i = 1; i <= 5; i++)
            hotkeysDictionary = hotkeysDictionary.add({
              combo: `ctrl+${i}`,
              description: `Only show operation #${i}`,
              callback: (event, hotkey) =>
              {
                if (this.data.operation_numbers && this.data.operation_numbers.length >= i)
                  this.query.operation_number = i;
              }
            });

          return hotkeysDictionary;
        };

        const addSelectionHotkeys = hotkeysDictionary =>
        {
          for (let i = 0; i < 5; i++)
            hotkeysDictionary = hotkeysDictionary.add({
              combo: `f${i + 1}`,
              description: `Selects production order #${i + 1}`,
              callback: (event, hotkey) =>
              {
                if (this.data.selected && this.data.selected.length > i)
                  this.commands.selectMasterItem(this.data.selected[i]);
              }
            });

          return hotkeysDictionary;
        };

        addOperationHotkeys(hotkeysDictionary);
        addSelectionHotkeys(hotkeysDictionary);
      }]
  });