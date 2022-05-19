import * as angular from 'angular';
angular
    .module('citizenos')
    .directive('cosInitials', ['$log', function ($log) {
        return {
            restrict: 'A',
            scope: {
                cosInitials: '='
            },
            template: '{{initials}}',
            link: function (scope, elem, attrs) {
                var updateInitials = function () {
                    if (!scope.cosInitials || !scope.cosInitials.length) {
                        scope.initials = '';
                        return;
                    }

                    var parts = scope.cosInitials.split(/\s+/);
                    if (parts.length === 1) {
                        scope.initials = parts[0][0].toUpperCase();
                    } else {
                        scope.initials = parts[0][0].toUpperCase() + parts.pop()[0].toUpperCase();
                    }
                };

                var unregisterWatch = scope.$watch(function () {
                    return scope.cosInitials
                }, function () {
                    updateInitials();
                });

                elem.on('$destroy', function () {
                    unregisterWatch();
                });
            }
        }
    }]);
