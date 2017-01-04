'use strict';

angular
    .module('citizenos')
    .controller('TopicCtrl', ['$scope', '$state', '$stateParams', '$log', 'ngDialog', 'TopicMemberGroup', 'TopicMemberUser', function ($scope, $state, $stateParams, $log, ngDialog, TopicMemberGroup, TopicMemberUser) {
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

        $scope.userList = {
            isVisible: false,
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'name'
            }
        };

        $scope.TopicMemberGroup = TopicMemberGroup;

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

        $scope.doDeleteMemberGroup = function (topic, topicMemberGroup) {
            $log.debug('doDeleteMemberGroup', topic, topicMemberGroup);

            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_group_delete_confirm.html',
                    data: {
                        group: topicMemberGroup
                    }
                })
                .then(function () {
                    topicMemberGroup
                        .$delete({topicId: topic.id})
                        .then(function () {
                            topic.members.groups.rows.splice(topic.members.groups.rows.indexOf(topicMemberGroup));
                            topic.members.groups.count = topic.members.groups.rows.length;
                        });
                }, angular.noop);
        };

        $scope.TopicMemberUser = TopicMemberUser;

        $scope.doToggleMemberUserList = function (topic) {
            $log.debug('doToggleMemberUserList', topic);
            
            if ($scope.userList.isVisible) {
                $scope.userList.isVisible = false;
                return;
            }

            TopicMemberUser
                .query({topicId: topic.id}).$promise
                .then(function (users) {
                    topic.members.users.rows = users;
                    topic.members.users.count = users.length;
                    $scope.userList.isVisible = true;
                });
        };

    }]);
