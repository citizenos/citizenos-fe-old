'use strict';

angular
    .module('citizenos')
    .controller('SearchCtrl', ['$scope', '$log', 'sSearch', function ($scope, $log, sSearch) {
        $log.debug('sSearch');

        $scope.form = {
            searchInput: null
        };

        $scope.searchResults = null;

        $scope.doSearch = function (str) {
            if (!str || str.length < 3) {
                $scope.app.showSearchResults = false;
                return;
            }

            // TODO: Should use some kind of previous request cancellation mechanism while typing fast.
            sSearch
                .search(str)
                .then(function (results) {
                    $scope.searchResults = results;
                    $scope.app.showSearchResults = true;
                    $scope.app.showNav = false;
                    $scope.app.open_mobile_fi = false;
                }, function (err) {
                    $log.error('SearchCtrl', 'Failed to retrieve search results', err);
                });
        };

        $scope.$watch(
            function () {
                return $scope.form.searchInput
            }
            , function (newValue) {
                $scope.doSearch(newValue);
            }
        );

        /* Make search area appear when selecting it and letters have been typed */
        $scope.checkLAndO = function () {
            $scope.doSearch($scope.form.searchInput);
        };

    }]);
