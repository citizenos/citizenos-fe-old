import * as angular from 'angular';
import * as moment from 'moment';

angular
    .module('citizenos')
    .directive('cosToggle', [function () {
        return {
            restrict: 'A',
            replace: false,
            template: ' \
            <div class="toggle_cell" > \
                <div class="toggle_widget text_on" ng-click="cosToggle()" ng-class="enabled ? \'on\' : \'off\'"> \
                    <div class="toggle_circle"></div> \
                     <div class="toggle_text" ng-if="cosToggleTextOff && !enabled"> \
                        <div class="table_cell">{{cosToggleTextOff}}</div> \
                    </div> \
                    <div class="toggle_text" ng-if="cosToggleTextOn && enabled"> \
                        <div class="table_cell">{{cosToggleTextOn}}</div> \
                    </div> \
                </div> \
            </div> \
            ',
            scope: {
                model: '=ngModel',
                value: '=?ngValue',
                offvalue: '=?offValue',
                cosToggleTextOn: '=?',
                cosToggleTextOff: '=?',
                cosToggleDatepickerToggle: '=?'
            },
            controller: ['$scope', '$element', function ($scope, $element) {
                $scope.enabled = false;

                if(!$scope.value) {
                    $scope.enabled = $scope.model;
                }

                if($scope.value && $scope.model === $scope.value) {
                    $scope.enabled = true;
                }

                $scope.cosToggle = function () {
                    if($scope.value){
                        if($scope.model === $scope.value && $scope.offvalue){
                            $scope.model = $scope.offvalue;
                        } else {
                            $scope.model = $scope.value;
                        }
                    } else {
                        $scope.model = !$scope.model;
                    }
                };

                $scope.switch = function () {
                    if($scope.value && $scope.model === $scope.value) {
                        $scope.enabled = true;
                    } else if ($scope.value && $scope.model != $scope.value) {
                        $scope.enabled = false;
                    } else {
                        $scope.enabled = !$scope.enabled;
                    }
                };

                $scope.$watch(function(scope) { return scope.model },
                    function(newValue, oldValue) {
                        if ($scope.cosToggleDatepickerToggle && (oldValue === true && angular.isDate(newValue) || newValue instanceof moment)) {}
                        else if (newValue != oldValue) {
                            $scope.switch();
                        }
                    }
                );
            }]
        }
    }]);
