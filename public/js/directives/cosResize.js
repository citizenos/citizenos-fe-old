(function () {
    'use strict';

    // Allow copy-paste use of the directive in 3rd party projects
    var module = null;
    try {
        module = angular.module('citizenos');
    } catch (e) {
        // Deliberate, angular.module('modulename') would throw if a non existing module is fetched and we create a new if the namespace did not exist
        module = angular.module('citizenos', []);
    }

    module
        .directive('cosResize', ['$window', '$rootScope', function ($window, $rootScope) {
            return function (scope, element) {

                var w = angular.element($window);
                scope.getWindowDimensions = function () {
                    return {
                        'w': window.innerWidth
                    };
                };

                scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
                    $rootScope.wWidth = newValue.w;
                    if ($rootScope.wWidth > 1024) {
                        scope.app.showNav = false; // TODO: Bad separation of concerns that does not make this directive reusable but will do for now.
                    }
                }, true);

                w.bind('resize', function () {
                    scope.$apply();
                });
            }
        }]);
})();
