angular
    .module('citizenos')
    .directive('cosInput', ["$compile", function($compile) {
        return {
            restrict: 'A',
            replace: true,
            template: '<div class="input_wrap"><input ng-disabled="!app.vote_toggle" value="1000"></div>'
        }
    }]);
