angular
    .module('citizenos')
    .directive('cosToggle', [function () {
        return {
            restrict: 'A',
            replace: false,
            template: ' \
            <div class="toggle_cell" > \
                <div class="toggle_widget text_on" ng-click="cosToggle()" ng-class="model ? \'on\' : \'off\'"> \
                    <div class="toggle_circle"></div> \
                     <div class="toggle_text" ng-if="cosToggleTextOff && !model"> \
                        <div class="table_cell">{{cosToggleTextOff}}</div> \
                    </div> \
                    <div class="toggle_text" ng-if="cosToggleTextOn && model"> \
                        <div class="table_cell">{{cosToggleTextOn}}</div> \
                    </div> \
                </div> \
            </div> \
            ',
            scope: {
                model: '=ngModel',
                cosToggleTextOn: '=?',
                cosToggleTextOff: '=?'
            },
            controller: ['$scope', '$element', function ($scope, $element) {
                $scope.cosToggle = function () {
                    $scope.model = !$scope.model;
                };
            }]
        }
    }]);
