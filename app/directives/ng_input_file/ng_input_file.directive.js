angular.module('ng-input-file').directive('onFileChange', function()
{
  return {
    restrict: 'A',
    link: function (scope, element, attrs)
    {
      var onChangeHandler = scope.$eval(attrs.onFileChange);

      element.bind('change', function ()
      {
        scope.$apply(function ()
        {
          var files = element[0].files;
          if (files)
          {
            onChangeHandler(files);
          }
        });
      });

    }
  }
});