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
            module: 'Employee Management',
            description: 'Created an employee record successfully!'
          },
          deleted: {
            module: 'Employee Management',
            description: 'Deleted an employee record successfully!',
            toast: 'Deleted an employee record!'
          },
          modified: {
            module: 'Employee Management',
            description: 'Modified an employee record successfully!'
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

          CrudHandler.onAfterSelectMasterItem(this, () =>
          {
            this.selected_item.detail = this.selected_item.StockCode.Operations.map((operation, index) =>
            {
              let stage = {
                name: operation.name,
                dozen_quantity_remaining: this.selected_item.dozen_quantity,
                piece_quantity_remaining: this.selected_item.piece_quantity,
                lines: [
                  {
                    previous_line: null,
                    lines: []
                  }
                ]
              };

              if (index === 0)
                stage.lines = [
                  {
                    previous_line: {
                      date_finished: new Date(),
                      dozen_quantity: this.selected_item.dozen_quantity,
                      piece_quantity: this.selected_item.piece_quantity,
                      Employee: {
                        getFullName: () => this.selected_item.Employee.getFullName()
                      }
                    },
                    lines: [
                      {
                        employee: {
                          value: this.selected_item.employee_id,
                          display: this.selected_item.Employee.getFullName()
                        }
                      }
                    ]
                  }
                ];

              return stage;
            });
          });

          CrudHandler.onAfterCreateMasterItem(this, () =>
          {
            $mdDialog.show({
              contentElement: '#create-dialog',
              parent: angular.element(document.body)
            });
          });

          CrudHandler.onSaveSelectedMasterItem(this, transaction =>
          {
            let action = 'modified';
            let selectedItem = this.selected_item;
            if (this.selected_item.constructor === Object)
            {
              action = 'created';
              selectedItem.stock_code_id = selectedItem.stock_code.value;
              selectedItem.color_id = selectedItem.color.value;
              selectedItem.size_id = selectedItem.size.value;
              selectedItem.employee_id = selectedItem.employee.value;
              selectedItem = ModelProvider.models.Production.build(selectedItem);
            }

            return Notifier.perform(() =>
              selectedItem.save({
                transaction: transaction
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
         * Create new line.
         * @param lines
         */
        this.commands.createNewLine = lines =>
        {
          lines.push({});
        };

        /**
         * Deletes the selected line.
         * @param lines
         * @param line
         * @param message
         * @returns {*|Promise.<*>}
         */
        this.commands.deleteLine = (lines, line, message) =>
        {
          return CrudHandler._confirmation(message).then(() => lines.splice(lines.indexOf(line), 1), () => (0));
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
            return ModelProvider.models.StockCode.findAll({
              where: {
                name: {
                  $like: '%' + query + '%'
                }
              }
            }).then(stock_codes => stock_codes.map(function (stock_code)
            {
              return {
                value: stock_code.id,
                display: stock_code.name
              };
            }));
          },
          queryColor: query =>
          {
            return ModelProvider.models.Color.findAll({
              where: {
                name: {
                  $like: '%' + query + '%'
                }
              }
            }).then(colors => colors.map(function (color)
            {
              return {
                value: color.id,
                display: color.name
              };
            }));
          },
          querySize: query =>
          {
            return ModelProvider.models.Size.findAll({
              where: {
                name: {
                  $like: '%' + query + '%'
                }
              }
            }).then(sizes => sizes.map(function (size)
            {
              return {
                value: size.id,
                display: size.name
              };
            }));
          },
          queryEmployee: query =>
          {
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
            }).then(employees => employees.map(function (employee)
            {
              return {
                value: employee.id,
                display: employee.getFullName()
              };
            }));
          }
        };

        /**
         * Computes and updates quantity remaining.
         * @param operation
         */
        this.commands.computeQuantityRemaining = operation =>
        {
          const totalQuantity = operation.lines.reduce(
            (accumulator, line) => accumulator + line.previous_line.dozen_quantity * 12 + line.previous_line.piece_quantity - line.lines.reduce(
              (accumulator, line) => accumulator + line.dozen_quantity * 12 + line.piece_quantity, 0)
            , 0);

          if (!isNaN(totalQuantity))
          {
            operation.dozen_quantity_remaining = Math.floor(totalQuantity / 12);
            operation.piece_quantity_remaining = totalQuantity % 12;
          }
        };
      }]
  });