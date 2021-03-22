'use strict';

angular
    .module('citizenos')
    .controller('MyCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$q', '$log', 'Group', 'Topic', 'GroupMemberTopic', 'rItems', function ($rootScope, $scope, $state, $stateParams, $q, $log, Group, Topic, GroupMemberTopic, rItems) {
        $log.debug('MyCtrl', $stateParams, rItems);

        $scope.itemList = rItems;

        // All the Topic filters in the dropdown
        var filters = [
            {
                id: 'all',
                name: 'VIEWS.MY.FILTERS.SHOW_ALL_MY_TOPICS',
                onSelect: function () {
                    $state.go('my.topics', {filter: this.id}, {reload: true});
                }
            },
            {
                name: 'VIEWS.MY.FILTERS.SHOW_ONLY',
                children: [
                    {
                        id: 'public',
                        name: 'VIEWS.MY.FILTERS.MY_PUBLIC_TOPICS',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    },
                    {
                        id: 'private',
                        name: 'VIEWS.MY.FILTERS.MY_PRIVATE_TOPICS',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    },
                    {
                        id: 'haveVoted',
                        name: 'VIEWS.MY.FILTERS.TOPICS_I_HAVE_VOTED',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    },
                    {
                        id: 'haveNotVoted',
                        name: 'VIEWS.MY.FILTERS.TOPICS_I_HAVE_NOT_VOTED',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    },
                    {
                        id: 'iCreated',
                        name: 'VIEWS.MY.FILTERS.TOPICS_I_CREATED',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    },
                    {
                        id: 'inProgress',
                        name: 'VIEWS.MY.FILTERS.TOPICS_IN_PROGRESS',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    },
                    {
                        id: 'voting',
                        name: 'VIEWS.MY.FILTERS.TOPICS_IN_VOTING',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    },
                    {
                        id: 'followUp',
                        name: 'VIEWS.MY.FILTERS.TOPICS_IN_FOLLOW_UP',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    },
                    {
                        id: 'closed',
                        name: 'VIEWS.MY.FILTERS.TOPICS_CLOSED',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    },
                    {
                        id: 'pinnedTopics',
                        name: 'VIEWS.MY.FILTERS.TOPICS_PINNED',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    },
                    {
                        id: 'showModerated',
                        name: 'VIEWS.MY.FILTERS.TOPICS_MODERATED',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id}, {reload: true});
                        }
                    }
                ]
            },
            {
                id: 'grouped',
                name: 'VIEWS.MY.FILTERS.TOPICS_ORDERED_BY_GROUPS',
                onSelect: function () {
                    $state.go('my.groups', {filter: this.id}, {reload: true});
                }
            }
        ];

        var filterParam = $stateParams.filter || filters[0].id;
        $scope.filters = {
            items: filters,
            selected: _.find(filters, {id: filterParam}) || _.chain(filters).map('children').flatten().find({id: filterParam}).value() || filters[0]
        };

        $scope.$watch(
            function () {
                return $scope.itemList;
            },
            function (newList) {
                if (!newList || !newList.length) return;
                // Navigate to first item in the list on big screens.
                if ($rootScope.wWidth > 750) {
                    if ($state.is('my.groups') || $state.is('my.topics')) {
                        var item = $scope.itemList[0];
                        if ($scope.isGroup(item)) {
                            $state.go('my.groups.groupId', {
                                groupId: item.id,
                                filter: 'grouped'
                            });
                        } else {
                            $state.go('my.topics.topicId', {topicId: item.id});
                        }
                    }
                }
            }
        );

        $scope.isGroup = function (object) {
            return object instanceof Group;
        };

        var groupMemberTopicsVisible = []; // goupId-s of which GroupMemberTopic list is expanded

        $scope.isGroupMemberTopicsVisible = function (group) {
            return groupMemberTopicsVisible.indexOf(group.id) > -1;
        };

        $scope.doToggleGroupTopicList = function (group) {
            var indexGroupIdVisible = groupMemberTopicsVisible.indexOf(group.id);

            if (indexGroupIdVisible < 0) { // not visible
                GroupMemberTopic
                    .query({groupId: group.id}).$promise
                    .then(function (topics) {
                        group.members.topics.rows = topics;
                        group.members.topics.count = topics.length;
                        groupMemberTopicsVisible.push(group.id);
                    });
            } else { // already visible, we hide
                groupMemberTopicsVisible.splice(indexGroupIdVisible, 1);
            }
        };

        $scope.goToTopicView = function (topic, editMode) {
            var status = topic.status;
            var params = {topicId: topic.id};
            if (status === Topic.STATUSES.inProgress) {
                if (topic.canEdit() && editMode) {
                    params.editMode = true;
                }

                $state.go('topics.view', params);
            } else if (status === Topic.STATUSES.voting) {
                params.voteId = topic.voteId;
                $state.go('topics.view.votes.view', params);
            }
        };

        $scope.isActiveTopic = function (item) {
            if (item.id === ($state.params.topicId || $state.params.groupId)) {
                return true;
            }

            return false;
        };
    }]);
