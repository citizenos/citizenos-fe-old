'use strict';

angular
    .module('citizenos')
    .controller('HomeCtrl', ['$scope', '$log', 'sTopic', function ($scope, $log, sTopic) {
        $scope.isTopicListLoading = true;

        $scope.topicList = [];

        // Running request, so I can cancel it if needed.
        var loadTopicListPromise = null;

        $scope.loadTopicList = function () {
            $scope.isTopicListLoading = true;

            if (loadTopicListPromise) {
                loadTopicListPromise.abort();
            }

            loadTopicListPromise = sTopic.listUnauth();

            loadTopicListPromise
                .then(function (res) {
                        var topics = res.data.data.rows;
                        if (topics && topics.length) {
                            $scope.topicList = $scope.topicList.concat(topics);
                        }
                        $scope.isTopicListLoading = false;
                    },
                    function (res) {
                        $log.log('List fetch failed or was cancelled', res);
                        $scope.isTopicListLoading = false;
                    });
        };
        $scope.loadTopicList();

    }]);
