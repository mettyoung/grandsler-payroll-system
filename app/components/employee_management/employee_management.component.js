const fs = require('fs');
const base64 = require('base64-js');

angular.module('employee-management')
  .component('employeeManagement', {
    templateUrl: './components/employee_management/employee_management.template.html',
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
          CrudHandler.onPreload(this, transaction => Promise.all([
            ModelProvider.models.Position.findAll({
              transaction: transaction
            }),
            ModelProvider.models.TimeShift.findAll({
                transaction: transaction
              }
            )])
            .then(values =>
            {
              this.data.positions = values[0];
              this.data.time_shifts = values[1];
            }));

          CrudHandler.onLoad(this, pageOptions =>
          {
            const selectionOptions = {};

            // Add associations
            Object.assign(selectionOptions, {
              include: [ModelProvider.models.User, ModelProvider.models.TimeShift, ModelProvider.models.Position],
              where: {}
            });

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

            // Execute the query.
            return Promise.all([
              ModelProvider.models.Employee.findAll(Object.assign(pageOptions, selectionOptions)),
              ModelProvider.models.Employee.findAll(Object.assign({
                attributes: [[ModelProvider.models.sequelize.fn('COUNT', ModelProvider.models.sequelize.col('*')), 'total_count']],
              }, selectionOptions))])
              .then(values =>
              {
                return {
                  data: values[0],
                  total_count: values[1][0].get('total_count')
                };
              });
          });

          CrudHandler.onAfterSelectMasterItem(this, () =>
          {
            $mdDialog.show({
              contentElement: '#detail-dialog',
              parent: angular.element(document.body)
            });
          });

          CrudHandler.onAfterCreateMasterItem(this, () =>
          {
            $mdDialog.show({
              contentElement: '#detail-dialog',
              parent: angular.element(document.body)
            });
          });

          CrudHandler.onSaveSelectedMasterItem(this, transaction =>
          {
            let action = 'modified';
            let selectedItem = this.selected_item;
            if (this.selected_item.constructor === Object)
            {
              selectedItem.Employments = [selectedItem.Employment];
              selectedItem = ModelProvider.models.Employee.build(selectedItem, {
                include: [ModelProvider.models.Employment]
              });
              action = 'created';
            }

            return Notifier.perform(() =>
              selectedItem.save({
                transaction: transaction
              }).catch(error =>
              {
                if (error.name === 'SequelizeUniqueConstraintError')
                  return Promise.reject({
                    name: 'Unique Key Error',
                    message: 'Employee number is in used.'
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
        CrudHandler.bootstrap(this, $scope).then(() =>
        {
          /**
           * If environment is production or dev, then auto-load.
           */
          if (process.env.NODE_ENV !== 'test')
            this.commands.load()
        });

        /**
         * Hides the dialog.
         * @returns {Promise}
         */
        this.commands.close = () =>
        {
          return $mdDialog.hide().then(() => this.commands.load());
        };

        /**
         * Opens position registry.
         */
        this.commands.openPositionRegistry = () =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="40">' +
            '<position-registry on-dialog-closed="$ctrl.parent.commands.preload()" layout="column" style="height: 400px;"></position-registry>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };

        /**
         * Opens time-shift registry.
         */
        this.commands.openTimeShiftRegistry = () =>
        {

          $mdDialog.show({
            template: '<md-dialog flex="70">' +
            '<time-shift-registry on-dialog-closed="$ctrl.parent.commands.preload()"></time-shift-registry>' +
            '</md-dialog>',
            multiple: true,
            locals: {parent: this},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };

        /**
         * Opens memos.
         */
        this.commands.openMemos = employee =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<employee-memos selected_employee="$ctrl.selected_employee" layout="column" style="height: 400px;"></employee-memos>' +
            '</md-dialog>',
            locals: {selected_employee: employee},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };

        /**
         * Opens employment history.
         */
        this.commands.openEmploymentHistories = employee =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<employment-history selected_employee="$ctrl.selected_employee" layout="column" style="height: 400px;"></employment-history>' +
            '</md-dialog>',
            locals: {selected_employee: employee},
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };

        /**
         * Opens employment history.
         */
        this.commands.openUserAccount = employee =>
        {
          $mdDialog.show({
            template: '<md-dialog flex="60">' +
            '<user-account on-dialog-closed="$ctrl.parent.commands.load()" selected_employee="$ctrl.selected_employee" layout="column" style="height: 400px;"></user-account>' +
            '</md-dialog>',
            locals: {
              parent: this,
              selected_employee: employee
            },
            controller: angular.noop,
            controllerAs: '$ctrl',
            bindToController: true
          });
        };

        /**
         * On image changed.
         * @param imageSrc
         */
        this.commands.onImageChanged = files => {
          this.selected_item.picture = base64.fromByteArray(fs.readFileSync(files[0].path));
        };

        /**
         * Gets the loaded image.
         * @returns {*|employees.picture|{type}}
         */
        this.commands.getImage = () => {
          return this.selected_item.picture || base64.fromByteArray(fs.readFileSync('./app/assets/employee_placeholder.jpg'));
        };
      }]
  });