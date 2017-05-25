angular.module('employee-management')
  .config(['$mdIconProvider', $mdIconProvider =>
  {
    $mdIconProvider.iconSet('action', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-action.svg');
    $mdIconProvider.iconSet('communication', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-communication.svg');
    $mdIconProvider.iconSet('content', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-content.svg');
    $mdIconProvider.iconSet('image', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-image.svg');
    $mdIconProvider.iconSet('social', '../node_modules/material-design-icons/sprites/svg-sprite/svg-sprite-social.svg');
  }]);