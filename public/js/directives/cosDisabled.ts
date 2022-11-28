import * as angular from 'angular';
angular
    .module('citizenos')
    .directive('cosDisabled', ['$compile', '$timeout', '$log', function ($compile, $timeout, $log) {
        return {
            restrict: 'A',
            terminal: true,
            priority: 599, // Lower than ng-if, ng-repeat
            scope: true,
            compile: function (tElem, tAttrs) {
                tElem.removeAttr('cos-disabled'); // Remove itself from the template element to avoid compile loop
                tElem.removeAttr('cos-disabled-tooltip'); // Remove itself from the template element to avoid compile loop
                tElem.removeAttr('ng-repeat'); // Remove ng-repeat so that the when used along with ng-repeat the directive is not recompiled
                tElem.removeAttr('ng-if'); // Remove ng-if so that the when used along with ng-if the directive is not recompiled

                return function (scope, elem, attrs) {
                    var cosDisabled = scope.$eval(attrs.cosDisabled);
                    var cosDisabledTooltip = attrs.cosDisabledTooltip;

                    scope.isVisible = false;

                    if (cosDisabledTooltip) {
                        elem.attr('tooltips', '');
                        elem.attr('tooltip-template', cosDisabledTooltip);
                        elem.attr('tooltip-smart', true);
                        elem.attr('tooltip-show-trigger', 'mouseover click');
                        elem.attr('tooltip-show','{{isVisible}}');

                        elem.parent().on('mouseover', function () {
                            scope.isVisible = !scope.isVisible;
                        });
                    }

                    $compile(elem)(scope);

                    var update = function () {
                        var originalElement = elem;

                        // With tooltip on, the elem is not the original, but a "comment" that marks tooltip start. So elem.next gives the tooltip itself.
                        // Angular-tooltips also wraps the original element into 'tip-cont' element.
                        var tooltip;
                        if (Node.COMMENT_NODE === elem.prop('nodeType')) {
                            tooltip = angular.element(elem[0].nextSibling); // NOTE: Did not use "elem.next();" as IE returns the same comment node for each next() call.
                            if (tooltip.prop('tagName') !== 'TOOLTIP') {
                                $log.error('cosDisabled.link', 'update()', 'A non tooltip element found where tooltip is expected!', tooltip);
                            }
                        }
                        if (tooltip) {
                            originalElement = angular.element(tooltip.find('tip-cont').children());
                        }

                        if (!angular.isDefined(cosDisabled) || cosDisabled) {
                            originalElement.addClass('disabled');
                            originalElement.css('pointer-events', 'none');
                            originalElement.find('input').attr('disabled', true);
                            if (originalElement[0].tagName === 'INPUT') {
                                originalElement.attr('disabled', true);
                            }
                            if (tooltip) {
                                tooltip.removeClass('_force-hidden');
                            }
                        } else {
                            originalElement.removeClass('disabled');
                            originalElement.css('pointer-events', 'auto');
                            originalElement.find('input').removeAttr('disabled');
                            if (originalElement[0].tagName === 'INPUT') {
                                originalElement.removeAttr('disabled');
                            }
                            if (tooltip) {
                                tooltip.addClass('_force-hidden');
                            }
                        }
                    };

                    var watchDerigistrationFunction = scope.$watch(function () {
                        cosDisabled = scope.$eval(attrs.cosDisabled);
                        return cosDisabled;
                    }, function (newVal, oldVal) {
                        update();
                    });

                    // HACKISH: This forces one update once the parent tooltip directive is compiled so that the initial state for tooltip would be correct
                    $timeout(function () {
                        update();
                    });

                    scope.$on('$destroy', function () {
                        if (watchDerigistrationFunction) {
                            watchDerigistrationFunction();
                        }
                    });

                }
            }
        }
    }]);
