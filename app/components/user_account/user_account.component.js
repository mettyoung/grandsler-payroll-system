angular.module('user-account')
  .component('userAccount', {
    bindings: {
      selectedEmployee: '<',
    },
    templateUrl: './components/user_account/user_account.template.html',
    controller: ['$scope', '$mdDialog', 'Notifier', 'ModelProvider', 'CrudHandler',
      function ($scope, $mdDialog, Notifier, ModelProvider, CrudHandler)
      {
        const DEPENDENCY_TREE = [
          'Salary Criteria Registry',
          'Settings',
          {
            name: 'Employee Management',
            dependents: ['Position Registry', 'Time-shift Registry']
          },
          {
            name: 'Production Order',
            dependents: [
              {
                name: 'Stock Code Registry',
                dependents: [
                  {
                    name: 'Pipeline Registry',
                    dependents: ['Operation Registry']
                  }
                ]
              },
              'Color Registry', 'Size Registry'
            ]
          }
        ];

        /**
         * Extracts module names with flatted dependencies from dependency tree.
         * @param dependencyTree
         * @returns {Array}
         */
        function extractModulesFromDependencyTree(dependencyTree)
        {
          let modules = [];
          for (let module of dependencyTree)
          {
            if (typeof module !== 'string')
            {
              modules.push({
                name: module.name,
                dependents: extractModuleNamesFromDependencyTree(module.dependents)
              });
              modules = [...modules, ...extractModulesFromDependencyTree(module.dependents)]
            }
            else
              modules.push({
                name: module,
                dependents: []
              });
          }
          return modules;
        }


        /**
         * Extracts the module name in an array.
         * @param dependencyTree
         */
        function extractModuleNamesFromDependencyTree(dependencyTree)
        {
          let modules = [];
          for (let module of dependencyTree)
          {
            if (typeof module !== 'string')
            {
              modules.push(module.name);
              modules = [...modules, ...extractModuleNamesFromDependencyTree(module.dependents)]
            }

            else
              modules.push(module);
          }
          return modules;
        }

        /**
         * All modules.
         */
        let modulesDictionary = extractModulesFromDependencyTree(DEPENDENCY_TREE).reduce(function (accumulator, module, index)
          {
            accumulator[module.name] = Object.assign({
              is_checked: false,
              is_disabled: false,
              index: index
            }, module);
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
                    modulesDictionary = employee.User.UserPermissions
                      .reduce(function (accumulator, instance)
                      {
                        accumulator[instance.module_name].is_checked = true;
                        return accumulator;
                      }, modulesDictionary);

                  // Disables the dependents of the module if module is unchecked.
                  for (let key in modulesDictionary)
                  {
                    const module = modulesDictionary[key];
                    if (module.is_checked === false)
                      for (let dependent of module.dependents)
                        modulesDictionary[dependent].is_disabled = true;
                  }
                }

                // Properly format the view model.
                this.modules = Object.keys(modulesDictionary).map(key =>
                {
                  return modulesDictionary[key];
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
            return $mdDialog.hide();
          };

          /**
           * Disables and unsets the permission of the module's dependents.
           * @param module
           */
          this.commands.onUserPermissionChanged = module =>
          {
            for (let dependent of module.dependents)
            {
              this.modules[modulesDictionary[dependent].index].is_disabled = !module.is_checked;
              if (!module.is_checked)
                this.modules[modulesDictionary[dependent].index].is_checked = false;
            }
          };
        }
        ;
      }]
  })
;