'use strict';

angular
    .module('citizenos')
    .controller('HomeCtrl', ['$scope', '$log', '$location', '$window', '$state', '$stateParams', 'sTopic', function ($scope, $log, $location, $window, $state, $stateParams, sTopic) {
        $log.debug('HomeCtrl', $state);

        // Constant marking the "clear" or all options will do
        $scope.FILTERS_ALL = 'all';

        var resolveCategory = function () {
            var category;
            if ($state.current.name === 'category') {
                category = $stateParams.category;
            } else if (sTopic.CATEGORIES[$state.current.name]) {
                category = $state.current.name; //Check if special page for category
            }

            return sTopic.CATEGORIES[category] ? category : $scope.FILTERS_ALL;
        };

        var init = function () {
            $scope.filters = {
                categories: {
                    value: resolveCategory(),
                    options: [$scope.FILTERS_ALL].concat(_.values(sTopic.CATEGORIES))
                },
                statuses: {
                    value: $scope.FILTERS_ALL,
                    options: [$scope.FILTERS_ALL].concat(_.values(sTopic.STATUSES).concat('moderated'))
                },
                limit: 30,
                offset: 0,
                tabSelected: 'categories' // Mobile view has tabs where the filters are selected, indicates which filter tab is visible
            };

            $scope.topicList = [];
            $scope.topicCountTotal = null;
            $scope.isTopicListLoading = null; // Bool, but for initial load using null.
        };

        init();

        $scope.doSetStatus = function (status) {
            $scope.filters.statuses.value = status;

            if (status === $scope.FILTERS_ALL) {
                status = null;
            }

            $stateParams.topicStatus = status;
            $state.go($state.current.name, $stateParams);
        };

        $scope.doSetCategory = function (category) {
            if (category === $scope.FILTERS_ALL) {
                category = null;
                $stateParams.category = category;
                $state.go('home', $stateParams);
            } else {
                $stateParams.category = category;
                $state.go('category', $stateParams);
            }
        };

        /**
         * Clear all applied filters
         */
        $scope.doClearFilters = function () {
            $location.url('/');
            $scope.loadTopicList();
        };

        $scope.isFilterApplied = function () {
            return $scope.filters.categories.value !== $scope.FILTERS_ALL || $scope.filters.statuses.value !== $scope.FILTERS_ALL;
        };

        $scope.isTutorialVisible = function () {
            return $scope.filters.categories.value === $scope.FILTERS_ALL
                && $scope.filters.statuses.value === $scope.FILTERS_ALL
                && $scope.topicList.length; // Render tutorial only when there are topics, this avoids Android and alignment issues.
        };

        var resolveStatus = function () {
            if ($stateParams.topicStatus === $scope.FILTERS_ALL) {
                $scope.filters.statuses.value = $scope.FILTERS_ALL;
                $stateParams.topicStatus = null;
                return null;
            }
            var status = ($stateParams.topicStatus && $scope.filters.statuses.options.indexOf($stateParams.topicStatus) > -1) ? $stateParams.topicStatus: null;
            if (status) {
                $scope.filters.statuses.value = status;
            } else {
                $stateParams.topicStatus = null;
                $state.go($state.current.name, $stateParams);
            }

            return status;
        };

        $scope.loadTopicList = function () {
            $log.debug('HomeCtrl.loadTopicList()');
            if ($stateParams.category && !sTopic.CATEGORIES[$stateParams.category]) {
                return $state.go('error.404');
            }
            if ($scope.isTopicListLoading === true) {
                $log.warn('HomeCtrl.loadTopicList()', 'Topic list already loading, will skip this request.');
                return;
            }

            if ($scope.topicCountTotal && $scope.topicList.length >= $scope.topicCountTotal) {
                $log.warn('HomeCtrl.loadTopicList()', 'Maximum count of topics already loaded! Skipping API call.');
                return;
            }

            $scope.isTopicListLoading = true;

            var status = resolveStatus();
            console.log(status);
            var showModerated = false;
            if (status === 'moderated' ) {
                status = null;
                showModerated = true;
            }
            sTopic
                .listUnauth(
                    $scope.filters.statuses.value !== $scope.FILTERS_ALL ? status : null,
                    $scope.filters.categories.value !== $scope.FILTERS_ALL ? resolveCategory() : null,
                    showModerated,
                    $scope.filters.offset,
                    $scope.filters.limit
                )
                .then(
                    function (res) {
                        $scope.topicList = $scope.topicList.concat(res.data.data.rows);
                        $scope.topicCountTotal = res.data.data.countTotal;

                        $scope.filters.offset += $scope.filters.limit;

                        $scope.isTopicListLoading = false;
                    },
                    function (err) {
                        $log.warn('HomeCtrl.loadTopicList()', 'List fetch failed or was cancelled', err);
                        $scope.isTopicListLoading = false;
                    }
                );
        };
        $scope.loadTopicList();

        $scope.goToPage = function (url) {
            console.log(url);
            $window.location.href = url;
        }
    }]);
