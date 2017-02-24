angular
    .module('citizenos')
    .directive('cosDisabled', [function () {
        return {
            restrict: 'A',
            priority: -10,
            link: function (scope, elem, attrs) {
                var cosDisabled = scope.$eval(attrs.cosDisabled);
                var classDisabled = 'disabled';

                var update = function () {
                    if (cosDisabled) {
                        elem.addClass(classDisabled);
                    } else {
                        elem.removeClass(classDisabled);
                    }
                };

                elem.on('click', function (e) {
                    if (cosDisabled) {
                        e.stopImmediatePropagation();
                    }
                });

                scope.$watch(function () {
                    return cosDisabled;
                }, function () {
                    update();
                });

            }
        }
    }]);

