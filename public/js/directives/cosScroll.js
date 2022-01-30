'use strict'

angular
    .module('citizenos')
    .directive('cosScroll', ['$window', '$document',
        function ($window, $document) {
            return {
                scope: {
                    onScroll: '=?',
                    onScrollWindow: '=?'
                },
                link: function (scope, elem, attrs) {
                    if (scope.onScroll) {
                        var scrollFunction = _.debounce(scope.onScroll, 100);

                        var elementScrollHandler = function () {
                            if ((elem[0].scrollTop + elem[0].offsetHeight) >= elem[0].scrollHeight) {
                                scrollFunction();
                            }
                        };

                        elem.on('scroll', scope.$apply.bind(scope, elementScrollHandler));

                        scope.$on('$destroy', function () {
                            elem.off('scroll', elementScrollHandler);
                        });
                    }

                    if (scope.onScrollWindow) {
                        var scrollWindowDebounce = _.debounce(scope.onScrollWindow, 100);

                        var windowScrollHandler = function () {
                            if ($window.innerHeight + $window.scrollY >= $document[0].body.scrollHeight) {
                                scrollWindowDebounce();
                            }
                        };

                        var windowElement = angular.element($window);
                        windowElement.on('scroll', scope.$apply.bind(scope, windowScrollHandler));

                        scope.$on('$destroy', function () {
                            windowElement.off(windowScrollHandler);
                        });
                    }
                }
            }
        }
    ]);
