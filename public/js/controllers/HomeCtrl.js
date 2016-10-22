'use strict';

angular
    .module('citizenos')
    .controller('HomeCtrl', ['$scope', '$log', 'sTopic', function ($scope, $log, sTopic) {

        // Constant marking the "clear" or all options will do
        $scope.FILTERS_ALL = 'all';

        $scope.filters = {
            categories: {
                value: null,
                options: [$scope.FILTERS_ALL].concat(_.values(sTopic.CATEGORIES))
            },
            statuses: {
                value: null,
                options: [$scope.FILTERS_ALL].concat(_.values(sTopic.STATUSES))
            },
            limit: 50,
            offset: 0,
            tabSelected: 'categories' // Mobile view has tabs where the filters are selected, indicates which filter tab is visible
        };

        /**
         * Update topic list
         *
         * @param {object} filter The property of filter that changed. For ex filters.statuses, filters.categories
         * @param {string} value The new value
         */
        $scope.doSetFilter = function (filter, value) {
            filter.value = value;

            $scope.loadTopicList();
        };

        $scope.topicList = [];
        $scope.isTopicListLoading = true;

        // Running request, so I can cancel it if needed.
        var loadTopicListPromise = null;

        $scope.loadTopicList = function () {
            $scope.isTopicListLoading = true;

            if (loadTopicListPromise) {
                loadTopicListPromise.abort();
            }

            loadTopicListPromise = sTopic.listUnauth(
                $scope.filters.statuses.value !== $scope.FILTERS_ALL ? $scope.filters.statuses.value : null,
                $scope.filters.categories.value !== $scope.FILTERS_ALL ? $scope.filters.categories.value : null,
                $scope.filters.offset,
                $scope.filters.limit
            );

            loadTopicListPromise
                .then(function (res) {
                        $scope.topicList = res.data.data.rows;
                        $scope.isTopicListLoading = false;
                    },
                    function (err) {
                        $log.log('List fetch failed or was cancelled', err);
                        $scope.isTopicListLoading = false;
                    });
        };
        $scope.loadTopicList();

    }]);
