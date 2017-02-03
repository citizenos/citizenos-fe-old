/**
 *   Toggle for angular
 *   Has no isolated scope because it might get interfered if another directive is used.
 *   For custom toggle button use cos-toggle-switch on desired element, else inserts default toggle button
 */
angular
    .module('citizenos')
    .directive('cosToggle', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            replace: false,
            controller: ['$scope', '$element', function ($scope, $element) {
                $scope.cosToggleOn = angular.isDefined($element.attr('cos-toggle-on')) ? $element.attr('cos-toggle-on') : true; //Hack to get values without using restricted scope
                $scope.cosToggleOff = angular.isDefined($element.attr('cos-toggle-off')) ? $element.attr('cos-toggle-off') : false;
                $scope.cosToggleState = angular.isDefined($element.attr('cos-toggle-state')) ? $element.attr('cos-toggle-state') : $scope.cosToggleOff;

                $scope.cosToggle = function () {
                    if ($scope.cosToggleState === $scope.cosToggleOn) {
                        $scope.cosToggleState = $scope.cosToggleOff;
                    } else {
                        $scope.cosToggleState = $scope.cosToggleOn;
                    }
                    $scope.cosToggleStatus();
                };

                $scope.cosToggleStatus = function () {
                    return $scope.cosToggleState === $scope.cosToggleOn;
                }
            }],
            link: function (scope, element) {
                var $input = element.find('input');
                var contentHtml = element.html();

                if (contentHtml.indexOf('cos-toggle-switch') < 0) {
                    element.parent().prepend($compile('\
                        <div class="toggle_cell">\
                            <div class="toggle_widget" ng-click="cosToggle()" ng-class="cosToggleStatus() ? \'no\' : \'yes\'">\
                                <div class="toggle_circle"></div>\
                            </div>\
                        </div>\
                    ')(scope));
                }
                if ($input && $input[0]) {
                    $input.attr('ng-disabled', 'cosToggleStatus()');
                    $input.replaceWith($compile($input[0].outerHTML)(scope));
                }
            }
        }
    }]);

angular
    .module('citizenos')
    .directive('cosToggleSwitch', function () {
        return {
            require: '^cosToggle',
            link: function (scope, element, attrs, controller) {
                element.off();
                element.on('click', function (e) {
                    scope.$apply(function () {
                        scope.cosToggle();
                    });
                });
            }
        };
    });
