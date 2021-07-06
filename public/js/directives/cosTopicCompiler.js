angular
    .module('citizenos')
    .directive('cosTopicCompiler', ['$compile', function ($compile) {
        return {
          restrict: 'A',
          scope: true,
          link: function (scope, element, attrs) {
            scope.$watch(function () {
              return scope.$eval(attrs.cosTopicCompiler);
            }, function (value) {
              // Incase value is a TrustedValueHolderType, sometimes it
              // needs to be explicitly called into a string in order to
              // get the HTML string.
              element.html(value && value.toString());
              // If scope is provided use it, otherwise use parent scope
              var compileScope = scope;

              $compile(element.contents())(compileScope);
            });
          }
        };
      }]);
