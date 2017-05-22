angular.module('employee-management')
  .component('employeeManagement', {
    templateUrl: './components/employee_management/employee_management.template.html',
    controller: ['$scope', 'CrudHandler', 'ModelProvider',
      function ($scope, CrudHandler, ModelProvider)
      {
        /**
         * Lifecycles
         */
        {
          CrudHandler.onPreload(this, transaction => ModelProvider.models.Position.findAll({
            transaction: transaction
          }).then(positions => this.data.positions = positions));

          CrudHandler.onLoad(this, options =>
          {
            Object.assign(options, {
              include: [ModelProvider.models.User, ModelProvider.models.TimeShift, ModelProvider.models.Position]
            });

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