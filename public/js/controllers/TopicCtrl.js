'use strict';

angular
    .module('citizenos')
    .controller('TopicCtrl', ['$scope', '$state', '$stateParams', '$log', 'TopicMemberGroup', function ($scope, $state, $stateParams, $log, TopicMemberGroup) {
        $log.debug('TopicCtrl');

        $scope.topic = _.find($scope.itemList, {id: $stateParams.topicId});

        $scope.generalInfo = {
            isVisible: true
        };

        $scope.groupList = {
            isVisible: false,
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'name'
            }
        };

        $scope.doToggleGroupList = function (topic) {
            if ($scope.groupList.isVisible) {
                $scope.groupList.isVisible = false;
                return;
            }

            TopicMemberGroup
                .query({topicId: topic.id}).$promise
                .then(function (groups) {
                    topic.members.groups.rows = groups;
                    topic.members.groups.count = groups.length;
                    $scope.groupList.isVisible = true;
                });
        };

        $scope.doUpdateMemberGroup = function (topic, topicMemberGroup, level) {
            $log.debug('doUpdateMemberGroup', topic, topicMemberGroup, level);

            if (topicMemberGroup.level !== level) {
                var oldLevel = topicMemberGroup.level;
                topicMemberGroup.level = level;
                topicMemberGroup
                    .$update({topicId: topic.id})
                    .then(
                        angular.noop,
                        function () {
                            topicMemberGroup.level = oldLevel;
                        });
            }
        };

        $scope.TopicMemberGroup = TopicMemberGroup;

    }]);
