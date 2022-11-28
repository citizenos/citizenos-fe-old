import * as angular from 'angular';
angular
    .module('citizenos')
    .directive('required', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, elem, attrs) {
                if (attrs.placeholder) {
                    $timeout(function () {
                        elem.attr('placeholder', attrs.placeholder + ' *');
                    });
                }
            }
        }
    }]);
