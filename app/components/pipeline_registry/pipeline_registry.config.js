angular.module('pipeline-registry')
  .config(['$mdIconProvider', $mdIconProvider =>
  {
    $mdIconProvider.iconSet('action', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-action.svg');
    $mdIconProvider.iconSet('content', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-content.svg');
  }]);