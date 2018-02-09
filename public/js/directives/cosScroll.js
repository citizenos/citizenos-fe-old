'use strict'

angular
    .module('citizenos')
    .directive('scroll', [
        function() {
            return {
                scope: {
                    onScroll: '='
                },
                link: function (scope, elem, attrs) {
                    var definedAction = function () {
                        if (scope.onScroll) {
                            console.log('ONSCROLL');
                            return scope.onScroll();
                        }
                        console.log('NO SCROLL');
                    }
                    var scrollFunc = _.debounce(definedAction, 200);
                    elem.on('scroll', function (e) {
                            scrollFunc();
                    });
                }
            }
        }
    ]);