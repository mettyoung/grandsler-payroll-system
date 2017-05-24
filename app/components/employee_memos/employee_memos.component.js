angular.module('employee-memos')
  .component('employeeMemos', {
    bindings: {
      'selectedEmployee': '<'
    },
    templateUrl: './components/employee_memos/employee_memos.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'ModelProvider', 'CrudHandler',
      function ($scope, $mdDialog, Notifier, ModelProvider, CrudHandler)
      {
        this.$onInit = () =>
        {
          /**
           * This is used for the Notifier module.
           * @type {{created: {module: string, description: string}, deleted: {module: string, description: string, toast: string}, modified: {module: string, description: string}}}
           */
          const MESSAGE = {
            created: {
              module: 'Employee Memos',
              description: 'Created an employee memo successfully!'
            },
            deleted: {
              module: 'Employee Memos',
              description: 'Deleted an employee memo successfully!',
              toast: 'Deleted an employee memo!'
            },
            modified: {
              module: 'Employee Memos',
              description: 'Modified an employee memo successfully!'
            }
          };

          /**
           * Lifecycles
           */
          {
            CrudHandler.onSaveSelectedMasterItem(this, transaction =>
            {
              this.selected_item.employee_id = this.selectedEmployee.id;

              let action = 'modified';
              if (this.selected_item.constructor === Object)
              {
                this.selected_item = ModelProvider.models.EmployeeMemo.build(this.selected_item);
                action = 'created';
              }

              return Notifier.perform(() =>
                this.selected_item.save({
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
                }).then(() =>
                {
                  this.commands.close();
                  return MESSAGE.deleted;
                });
              }, transaction);
            });
            
            CrudHandler.onLoad(this, pageOptions =>
            {
              let options = {
                transaction: pageOptions.transaction,
                where: {
                  employee_id: this.selectedEmployee.id
                },
                order: [['created_at', 'DESC']]
              };

              return ModelProvider.models.EmployeeMemo.findAll(options).then(memos =>
              {
                return {
                  data: memos
                };
              });
            });
          }

          /**
           * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
           */
          CrudHandler.bootstrap(this, $scope, {
            message: MESSAGE
          });

          /**
           * If environment is production or dev, then auto-load.
           */
          if (process.env.NODE_ENV !== 'test')
            this.commands.load();

          /**
           * Hides the dialog.
           * @returns {Promise}
           */
          this.commands.close = () =>
          {
            return $mdDialog.hide();
          };
        };
      }]
  });