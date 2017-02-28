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
                        elem.find('input').attr('disabled', true);
                        if (elem[0].tagName === 'INPUT') {
                            elem.attr('disabled', true);
                        }
                    } else {
                        elem.removeClass(classDisabled);
                        elem.find('input').removeAttr('disabled');
                        if (elem[0].tagName === 'INPUT') {
                            elem.removeAttr('disabled');
                        }
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

