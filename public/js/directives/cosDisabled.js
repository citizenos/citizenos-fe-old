angular
    .module('citizenos')
    .directive('cosDisabled', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            priority: -10,
            link: function (scope, elem, attrs) {
                var cosDisabled = scope.$eval(attrs.cosDisabled);
                var classDisabled = 'disabled';

                var update = function () {
                    if (cosDisabled) {
                        elem.addClass(classDisabled);
                        elem.css('pointer-events', 'none');
                        elem.find('input').attr('disabled', true);
                        if (elem[0].tagName === 'INPUT') {
                            elem.attr('disabled', true);
                        }
                    } else {
                        elem.removeClass(classDisabled);
                        elem.css('pointer-events', 'auto');
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

                $timeout(function () { // To disable all innerElement click events $timeout helps to override ng-click events created inside other directives eg. cosToggle
                    elem.find('*').on('click', function (e) {
                        if (cosDisabled) {
                            e.stopImmediatePropagation();
                        }
                    });
                });

                scope.$watch(function () {
                    cosDisabled = scope.$eval(attrs.cosDisabled);
                    return cosDisabled;
                }, function () {
                    update();
                });

            }
        }
    }]);
