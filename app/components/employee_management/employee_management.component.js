angular.module('employee-management')
  .component('employeeManagement', {
    templateUrl: './components/employee_management/employee_management.template.html',
    controller: ['$scope', 'ModelProvider',
      function ($scope, ModelProvider)
      {
        this.preset = {
          limitOptions: [5, 10, 15]
        };

        this.data = {
          selected: [],
          progress: null,
          total_count: 0
        };

        this.query = {
          order: 'id',
          limit: 10,
          page: 1
        };

        const processQuery = query =>
        {
          // Extract column name with direction
          let directionToken = query.order.split('-');
          let orderBy = directionToken.pop();
          let direction = directionToken.length > 0 ? 'DESC' : 'ASC';

          // Get the N-1 tokens as association tokens.
          let associationTokens = orderBy.split('.');
          // Take the last token as the column name.
          let columnName = associationTokens.pop();

          let associations = associationTokens.map(token =>
          {
            return ModelProvider.models[token];
          });

          return {
            order: [[...associations, columnName, direction]],
            limit: query.limit,
            offset: query.limit * (query.page - 1)
          };
        };
        
        this.commands = {
          load: () =>
          {
            let query = Object.assign(processQuery(this.query), {
              include: [ModelProvider.models.User, ModelProvider.models.TimeShift, ModelProvider.models.Position]
            });

            this.data.progress = Promise.all([
              ModelProvider.models.Employee.findAll(query),
              ModelProvider.models.Employee.findAll({
                attributes: [[ModelProvider.models.sequelize.fn('COUNT', ModelProvider.models.sequelize.col('*')), 'total_count']],
              })])
              .then(values =>
              {
                this.data.selected = values[0];
                this.data.total_count = values[1][0].get('total_count');
                $scope.$apply();
              });
          },
          modify: () => (0),
          create: () => (0)
        };

        this.commands.load();
      }]
  });