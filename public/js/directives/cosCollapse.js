angular
    .module('citizenos')
    .directive('cosCollapse', ['$log', function ($log) {
        return {
            restrict: 'A',
            scope: {
                onToggle: '&'
            },
            controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                $log.debug('cosCollapse.controller', $scope, $element, $attrs);

                this.isCosToggleCollapsed = true;

                this.cosCollapseToggle = function () {
                    if (this.isCosToggleCollapsed) {
                        $scope.onToggle()();
                        this.isCosToggleCollapsed = false;
                    } else {
                        this.isCosToggleCollapsed = true;
                    }
                }

            }],
            link: function (scope, elem, attrs) {
                $log.debug('cosCollapse.link', arguments);
            }
        }
    }]);


angular
    .module('citizenos')
    .directive('cosCollapseToggle', function () {
        return {
            require: '^cosCollapse',
            link: function (scope, element, attrs, controller) {
                console.log('cosCollapseToggle.link', scope);
                element.bind('click', function (e) {
                    scope.$apply(function () {
                        controller.cosCollapseToggle();
                    });
                });

                scope.$watch(
                    function () {
                        return controller.isCosToggleCollapsed;
                    }, function () {
                        scope.isCosToggleCollapsed = controller.isCosToggleCollapsed;
                    });
            }
        };
    });

