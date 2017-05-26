angular.module('user-account')
  .component('userAccount', {
    bindings: {
      selectedEmployee: '<',
      onDialogClosed: '&'
    },
    templateUrl: './components/user_account/user_account.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'ModelProvider', 'CrudHandler',
      function ($scope, $mdDialog, Notifier, ModelProvider, CrudHandler)
      {
        /**
         * All modules.
         */
        this.modules = ['Salary Criteria Registry', 'Position Registry', 'Time-shift Registry', 'Employee Management']
          .reduce(function (accumulator, module_name)
          {
            accumulator[module_name] = false;
            return accumulator;
          }, {});

        this.$onInit = () =>
        {
          /**
           * This is used for the Notifier module.
           * @type {{created: {module: string, description: string}, deleted: {module: string, description: string, toast: string}, modified: {module: string, description: string}}}
           */
          const MESSAGE = {
            created: {
              module: 'User Management',
              description: 'Created an user account successfully!'
            },
            modified: {
              module: 'User Management',
              description: 'Modified an user account successfully!'
            },
            deleted: {
              module: 'User Management',
              description: 'Deleted an user account successfully!',
              toast: 'Deleted an user account!'
            }
          };

          /**
           * Lifecycles
           */
          {
            CrudHandler.onSaveSelectedMasterItem(this, transaction =>
              {
                let action = 'modified';
                let user = this.selectedEmployee.User;
                if (this.selectedEmployee.User.constructor === Object)
                {
                  action = 'created';
                  user = ModelProvider.models.User.build(this.selectedEmployee.User);
                }

                // Upsert of User.
                let promise = user.save({transaction: transaction});

                // Link to employee.
                if (action === 'created')
                  promise = promise.then(user =>
                  {
                    this.selectedEmployee.user_id = user.id;
                    return this.selectedEmployee.save({transaction: transaction});
                  });

                // Destroy all User Permission if any.
                promise = promise.then(() =>
                  ModelProvider.models.UserPermission.destroy({
                    where: {
                      user_id: this.selectedEmployee.user_id
                    },
                    transaction: transaction
                  }));

                // Collect all checked user permissions.
                let userPermissions = this.modules.filter(module => module.is_checked).map(module =>
                {
                  return {
                    module_name: module.name
                  };
                });

                // Build all user permission and create them.
                for (let userPermission of userPermissions)
                {
                  promise = promise.then(() =>
                  {
                    userPermission.user_id = this.selectedEmployee.user_id;
                    ModelProvider.models.UserPermission.create(userPermission, {transaction: transaction})
                  });
                }

                return Notifier.perform(() =>
                  promise.then(() =>
                  {
                    this.commands.close();
                    return MESSAGE[action];
                  }), transaction);
              }
            );

            CrudHandler.onDeleteSelectedMasterItem(this, transaction =>
            {
              if (this.selectedEmployee.User.constructor === Object)
                return Promise.reject('Cannot delete a new record.');

              return Notifier.perform(() =>
              {
                this.selectedEmployee.user_id = null;
                return this.selectedEmployee.save({transaction: transaction})
                  .then(() => ModelProvider.models.UserPermission.destroy({
                    where: {
                      user_id: this.selectedEmployee.User.id
                    },
                    transaction: transaction
                  }))
                  .then(() => this.selectedEmployee.User.destroy({transaction: transaction}))
                  .catch(error =>
                  {
                    if (error.name === 'SequelizeForeignKeyConstraintError')
                      return Promise.reject({
                        name: 'Reference Error',
                        message: 'User is already in used.'
                      });
                    return Promise.reject(error);
                  })
                  .then(() =>
                  {
                    this.commands.close();
                    return MESSAGE.deleted;
                  });
              }, transaction);
            });

            CrudHandler.onPreload(this, transaction =>
            {
              let options = {
                transaction: transaction,
                where: {
                  id: this.selectedEmployee.id
                },
                include: [{
                  model: ModelProvider.models.User,
                  include: [{
                    model: ModelProvider.models.UserPermission,
                    required: false
                  }],
                  required: false
                }]
              };

              return ModelProvider.models.Employee.findOne(options).then(employee =>
              {
                // Reloaded the selectedEmployee with concerned associations.
                this.selectedEmployee = employee;

                // If there is a user, enable delete.
                if (employee.User)
                {
                  this.is_delete_disabled = false;

                  // Load the user permissions.
                  if (employee.User.UserPermissions)
                    this.modules = employee.User.UserPermissions
                      .reduce(function (accumulator, instance)
                      {
                        accumulator[instance.module_name] = true;
                        return accumulator;
                      }, this.modules);
                }

                // Properly format the view model.
                this.modules = Object.keys(this.modules).map(key =>
                {
                  return {
                    name: key,
                    is_checked: this.modules[key]
                  };
                });
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
           * Hides the dialog.
           * @returns {Promise}
           */
          this.commands.close = () =>
          {
            return $mdDialog.hide().then(() => this.onDialogClosed());
          };
        }
        ;
      }]
  })
;