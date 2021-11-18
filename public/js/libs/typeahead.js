/**
 * Modified version of - https://github.com/eyston/ymusica
 *
 * @see http://hueypetersen.com/posts/2013/06/24/typeahead-with-angular/
 */

var app = angular.module('typeahead', []);

app.directive('typeahead', ["$timeout", function ($timeout) {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template: '<div><div ng-class="{hidden: !label}" class="ac-label">{{label}}</div><div class="ac-input"><input ng-model="term" ng-change="query()" ng-model-options="{debounce:250}" type="text" autocomplete="off" placeholder="{{placeholder}}" focus-if autofocus/></div><div ng-transclude></div></div>',
        scope: {
            search: "&",
            enterAction: "&",
            select: "&",
            selectLimit: "=",
            items: "=",
            term: "=",
            placeholder: "@",
            label: "@"
        },
        controller: ["$scope", "$http", function ($scope, $http) {
            $scope.items = [];
            $scope.hide = false;
            this.itemsNoClose = []; // Do not close the search results for these items

            this.activate = function (item) {
                $scope.active = item;
            };

            this.activateNextItem = function () {
                var index = $scope.items.indexOf($scope.active);
                this.activate($scope.items[(index + 1) % $scope.items.length]);
            };

            this.activatePreviousItem = function () {
                var index = $scope.items.indexOf($scope.active);
                this.activate($scope.items[index === 0 ? $scope.items.length - 1 : index - 1]);
            };

            this.isActive = function (item) {
                return $scope.active === item;
            };

            this.selectActive = function () {
                this.select($scope.active);
            };

            this.enterAction = function () {
                $scope.enterAction({text: $scope.term, limit:true});
            };

            this.select = function (item) {
                if (this.itemsNoClose.indexOf(item) < 0) {
                    $scope.hide = true;
                    $scope.focused = true;
                    $scope.term = null;
                    $scope.items = [];
                }
                $scope.select({item: item});
            };

            $scope.isVisible = function () {
                return !$scope.hide && ($scope.focused || $scope.mousedOver);
            };

            var self = this;
            $scope.query = function () {
                $scope.hide = false;
                self.itemsNoClose = [];
                $scope.search({term: $scope.term});
            };
        }],

        link: function (scope, element, attrs, controller) {

            var $input = element.find('input');
            var $list = angular.element(element[0].querySelectorAll('[ng-transclude]'));

            $input.bind('focus', function () {
                scope.$apply(function () {
                    scope.focused = true;
                });
            });

            $input.bind('blur', function () {
                scope.$apply(function () {
                    scope.focused = false;
                });
            });

            $list.bind('mouseover', function () {
                scope.$apply(function () {
                    scope.mousedOver = true;
                });
            });

            $list.bind('mouseleave', function () {
                scope.$apply(function () {
                    scope.mousedOver = false;
                });
            });

            $input.bind('keyup', function (e) {
                if (e.keyCode === 13) { // ENTER
                    if (!scope.selectLimit || (scope.term && (scope.selectLimit <= scope.term.length)) || (scope.items && scope.items.length)) {
                        console.log('typeahead', 'selectActive');
                        scope.$apply(function () {
                            controller.selectActive();
                        });
                    } else {
                        scope.$apply(function () {
                            console.log('typeahead', 'enterAction');
                            controller.enterAction();
                        });
                    }
                }

                if (e.keyCode === 27) { // ESC
                    scope.$apply(function () {
                        scope.hide = true;
                        scope.term = null;
                    });
                }
            });

            $input.bind('keydown', function (e) {
                if (e.keyCode === 13) { // ENTER
                    e.preventDefault();
                }

                if (e.keyCode === 40 || e.keyCode === 9) { // DOWN OR TAB
                    e.preventDefault();
                    scope.$apply(function () {
                        controller.activateNextItem();
                    });
                }

                if (e.keyCode === 38) {
                    e.preventDefault();
                    scope.$apply(function () {
                        controller.activatePreviousItem();
                    });
                }
            });

            scope.$watch('items', function (items) {
                controller.activate(items.length ? items[0] : null);
            });

            scope.$watch('focused', function (focused) {
                if (focused) {
                    $timeout(function () {
                        $input[0].focus();
                    }, 0, false);
                }
            });
        }
    };
}]);

app.directive('typeaheadItem', function () {
    return {
        require: '^typeahead',
        link: function (scope, element, attrs, controller) {
            var item = scope.$eval(attrs.typeaheadItem);

            if (attrs.typeaheadItemNoClose && scope.$eval(attrs.typeaheadItemNoClose)) {
                controller.itemsNoClose.push(item);
            }

            scope.$watch(function () {
                return controller.isActive(item);
            }, function (active) {
                if (active) {
                    element.addClass('active');
                } else {
                    element.removeClass('active');
                }
            });

            element.bind('mouseenter', function (e) {
                scope.$apply(function () {
                    controller.activate(item);
                });
            });

            element.bind('click', function (e) {
                scope.$apply(function () {
                    controller.select(item);
                });
            });

            scope.$on('$destroy', function () {
                controller.itemsNoClose.splice(controller.itemsNoClose.indexOf(item), 1);
            });
        }
    };
});
