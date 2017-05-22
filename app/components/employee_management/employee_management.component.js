angular.module('employee-management')
  .component('employeeManagement', {
    templateUrl: './components/employee_management/employee_management.template.html',
    controller: ['$scope', 'CrudHandler', 'ModelProvider',
      function ($scope, CrudHandler, ModelProvider)
      {
        /**
         * Life cycles
         */
        {
          CrudHandler.onPreload(this, transaction => ModelProvider.models.Position.findAll({
            transaction: transaction
          }).then(positions => this.data.positions = positions));

          CrudHandler.onLoad(this, options =>
          {
            // Add associations
            Object.assign(options, {
              include: [ModelProvider.models.User, ModelProvider.models.TimeShift, ModelProvider.models.Position],
              where: {
                $and: {}
              }
            });

            // Add filters
            if (this.query.employee_type !== 0)
              Object.assign(options.where.$and, {
                employee_type: this.query.employee_type
              });
            
            if (this.query.position_id > 0)
              Object.assign(options.where.$and, {
                position_id: this.query.position_id
              });

            if (this.query.name && this.query.name.length > 0)
              Object.assign(options.where.$and, {
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
              ModelProvider.models.Employee.findAll(options),
              ModelProvider.models.Employee.findAll({
                attributes: [[ModelProvider.models.sequelize.fn('COUNT', ModelProvider.models.sequelize.col('*')), 'total_count']],
              })])
              .then(values =>
              {
                return {
                  data: values[0],
                  total_count: values[1][0].get('total_count')
                };
              });
          });
        }

        /**
         * Bootstraps this controller with CrudHandler that handles the basic CRUD controller routines.
         */
        CrudHandler.bootstrap(this, $scope);
      }]
  });