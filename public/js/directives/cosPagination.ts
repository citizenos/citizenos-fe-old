'use strict'
import * as angular from 'angular';

angular
    .module('citizenos')
    .directive('cosPagination', [function () {
        return {
            restrict: 'A',
            replace: false,
            template: ' \
            <div class="pagination" ng-if="totalPages > 1"> \
                <div class="pagination_items_wrap"> \
                    <div class="page_button button_prev table_cell" ng-click="loadPrevious()">«</div> \
                    <div class="page_button table_cell" ng-repeat="x in pages()" ng-click="select(x)" ng-class="{\'active\': x === page }">{{x}}</div> \
                    <div class="page_button button_next table_cell" ng-click="loadNext()">»</div> \
                </div> \
            </div> \
            ',
            scope: {
                totalPages: '=?',
                page: '=?',
                select: '=?'
            },
            controller: ['$scope', function ($scope) {
                $scope.pages = function () {
                    var array = [];

                    if ($scope.totalPages <= 5) {
                        for (var i = 1; i <= $scope.totalPages; i++) {
                            array.push(i);
                        }
                    } else if ($scope.page < 4) {
                        for (var i = 1; i < 6; i++) {
                            array.push(i);
                        }
                    } else if ($scope.totalPages - $scope.page >= 2) {
                        for (var i = -2; i < 3; i++) {
                            array.push($scope.page + i);
                        }
                    } else {
                        for (var i = -4; i < 1; i++) {
                            array.push($scope.totalPages + i);
                        }
                    }

                    return array;
                };

                $scope.loadNext = function () {
                    if ($scope.page === $scope.totalPages) {
                        return;
                    }
                    $scope.select($scope.page + 1);
                };

                $scope.loadPrevious = function () {
                    if ($scope.page === 1) {
                        return;
                    }
                    $scope.select($scope.page - 1);
                };
            }
        ]
        }
    }
]);
