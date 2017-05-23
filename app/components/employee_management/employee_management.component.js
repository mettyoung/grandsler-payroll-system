angular.module('employee-management')
  .component('employeeManagement', {
    templateUrl: './components/employee_management/employee_management.template.html',
    controller: ['$scope', '$mdDialog', 'CrudHandler', 'ModelProvider',
      function ($scope, $mdDialog, CrudHandler, ModelProvider)
      {
        /**
         * Life cycles
         */
        {
          CrudHandler.onPreload(this, transaction => ModelProvider.models.Position.findAll({
            transaction: transaction
          }).then(positions => this.data.positions = positions));

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
          })
        }

        /**
         * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
         */
        CrudHandler.bootstrap(this, $scope);
      }]
  });