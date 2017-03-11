angular
    .module('citizenos')
    .directive('cosDisabled', ['$compile', '$log', function ($compile, $log) {
        return {
            restrict: 'A',
            priority: -1000,
            compile: function (tElem, tAttrs) {
                $log.debug('cosDisabled.compile', tElem, tAttrs);

                tElem.removeAttr('cos-disabled');
                tElem.removeAttr('cos-disabled-tooltip');
                tElem.removeAttr('ng-repeat'); // Remove ng-repeat so that the when used along with ng-repeat the directive is not recompiled

                return function (scope, elem, attrs) {
                    $log.debug('cosDisabled.link', scope, elem, attrs);

                    var cosDisabled = scope.$eval(attrs.cosDisabled);
                    var cosDisabledTooltip = tAttrs.cosDisabledTooltip;

                    if (cosDisabledTooltip) {
                        elem.attr('tooltips', '');
                        elem.attr('tooltip-template', cosDisabledTooltip);
                        elem.attr('tooltip-smart', true);
                    }

                    var update = function () {
                        $log.debug('cosDisabled.update()', cosDisabled, elem);

                        if (cosDisabled) {
                            elem.addClass(cosDisabledTooltip ? 'disabled_with_tooltip' : 'disabled');
                            elem.css('pointer-events', 'none');
                            elem.find('input').attr('disabled', true);
                            if (elem[0].tagName === 'INPUT') {
                                elem.attr('disabled', true);
                            }
                        } else {
                            elem.removeClass(cosDisabledTooltip ? 'disabled_with_tooltip' : 'disabled');
                            elem.css('pointer-events', 'auto');
                            elem.find('input').removeAttr('disabled');
                            if (elem[0].tagName === 'INPUT') {
                                elem.removeAttr('disabled');
                            }
                        }

                        $compile(elem)(scope);
                    };

                    scope.$watch(function () {
                        return cosDisabled;
                    }, function (newVal, oldVal) {
                        $log.debug('cosDisabled.watch', arguments);
                        update();
                    });

                }
            }
        }
    }]);
