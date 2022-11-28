import * as angular from 'angular';
angular
    .module('citizenos')
    .directive('cosResize', ['$window', '$rootScope', 'AppService', function ($window, $rootScope, AppService) {
        return function (scope, element) {

            var w = angular.element($window);
            scope.getWindowDimensions = function () {
                return {
                    'w': window.innerWidth
                };
            };

            scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
                AppService.wWidth = newValue.w;
                $rootScope.wWidth = newValue.w;
                if ($rootScope.wWidth > 1024) {
                    AppService.showNav = false; // TODO: Bad separation of concerns that does not make this directive reusable but will do for now.
                }
            }, true);

            w.bind('resize', function () {
                scope.$apply();
            });
        }
    }]);
