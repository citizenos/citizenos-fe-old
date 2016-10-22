'use strict';

angular
    .module('citizenos')
    .controller('HomeCtrl', ['$scope', '$log', 'sTopic', function ($scope, $log, sTopic) {

        // Constant marking the "clear" or all options will do
        $scope.FILTERS_ALL = 'all';

        $scope.filters = {
            statuses: {
                value: null,
                options: [$scope.FILTERS_ALL].concat(_.values(sTopic.STATUSES))
            },
            categories: {
                value: null,
                options: [$scope.FILTERS_ALL].concat(_.values(sTopic.CATEGORIES))
            },
            limit: 50,
            offset: 0,
            infiniteScrollDisabled: true
        };

        /**
         * Update topic list
         *
         * @param {object} filter The property of filter that changed. For ex filters.statuses, filters.categories
         * @param {string} value The new value
         */
        $scope.doSetFilter = function (filter, value) {
            if (value === $scope.FILTERS_ALL) {
                value = null;
            }
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

            loadTopicListPromise = sTopic.listUnauth($scope.filters.statuses.value, $scope.filters.categories.value, $scope.filters.offset, $scope.filters.limit);

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
