import * as angular from 'angular';
angular
    .module('citizenos')
    .directive('cosInput', function() {
        return {
            restrict: 'A',
            replace: true,
            template: '<div class="input_wrap"><input ng-model="item"></div>',
            scope: {
                item: '=cosInput'
            }
        }
    });
