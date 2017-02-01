angular
    .module('citizenos')
    .directive('cosInput', ["$compile", function($compile) {
        return {
            restrict: 'A',
            replace: true,
            template: '<div class="input_wrap"><input ng-disabled="!disabled" ng-model="item"></div>',
            scope: {
                disabled: '=',
                item: '='
            }
        }
    }]);
