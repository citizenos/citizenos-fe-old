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
                        var definedAction = function () {
                            if (scope.onScroll) {
                                return scope.onScroll();
                            }
                        };

                        var scrollFunc = _.debounce(definedAction, 100);
                        var elementScrollHandler = function () {
                            if ((elem[0].scrollTop + elem[0].offsetHeight) >= elem[0].scrollHeight) {
                                scrollFunc();
                            }
                        };

                        elem.on('scroll', scope.$apply.bind(scope, elementScrollHandler));

                        scope.$on('$destroy', function () {
                            elem.off('scroll', elementScrollHandler);
                        });
                    }

                    if (scope.onScrollWindow) {
                        var windowScrollHandler = function () {
                            console.error('cosScroll', windowScrollHandler, $window.innerHeight + $window.scrollY, $document[0].body.scrollHeight, $window.innerHeight + $window.scrollY >= $document[0].body.scrollHeight);
                        };

                        var windowelement = angular.element($window);
                        windowelement.on('scroll', scope.$apply.bind(scope, windowScrollHandler));

                        scope.$on('$destroy', function () {
                            windowelement.off(windowScrollHandler);
                        });
                    }
                }
            }
        }
    ]);
