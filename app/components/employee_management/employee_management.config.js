angular.module('employee-management')
  .config(['$mdIconProvider', $mdIconProvider =>
  {
    $mdIconProvider.iconSet('content', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-content.svg');
  }]);