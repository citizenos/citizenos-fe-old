'use strict';

angular
    .module('citizenos')
    .controller('MyCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$q', '$log', 'sAuth', 'Group', 'Topic', 'GroupMemberTopic', function ($rootScope, $scope, $state, $stateParams, $q, $log, sAuth, Group, Topic, GroupMemberTopic) {
        $log.debug('MyCtrl', $stateParams);

        $scope.itemList = []; // Contains Groups and Topics
        $scope.itemListIsLoading = true;

        // All the Topic filters in the dropdown
        var filters = [
            {
                id: 'all',
                name: 'Show all my topics',
                onSelect: function () {
                    $state.go('my.topics', {filter: this.id});
                },
                loadData: function () {
                    return Topic
                        .query().$promise;
                }
            },
            {
                name: 'Show only:',
                children: [
                    {
                        id: 'public',
                        name: 'My public topics',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id});
                        },
                        loadData: function () {
                            return Topic
                                .query({visibility: Topic.VISIBILITY.public}).$promise;
                        }
                    },
                    {
                        id: 'private',
                        name: 'My private topics',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id});
                        },
                        loadData: function () {
                            return Topic
                                .query({visibility: Topic.VISIBILITY.private}).$promise;
                        }
                    },
                    {
                        id: 'iCreated',
                        name: 'Topics I created',
                        onSelect: function () {
                            $state.go('my.topics', {filter: this.id});
                        },
                        loadData: function () {
                            return Topic
                                .query({creatorId: sAuth.user.id}).$promise;
                        }

                    }
                ]
            },
            {
                id: 'grouped',
                name: 'Show topics ordered by groups',
                onSelect: function () {
                    $state.go('my.groups', {filter: this.id});
                },
                loadData: function () {
                    return Group
                        .query({include: ['member.topic']}).$promise;
                }
            }
        ];

        var filterParam = $state.includes('my.groups') ? 'grouped' : $stateParams.filter || filters[0].id;
        $scope.filters = {
            items: filters,
            selected: _.find(filters, {id: filterParam}) || _.chain(filters).map('children').flatten().find({id: filterParam}).value() || filters[0]
        };

        var init = function () {
            $scope.filters.selected
                .loadData()
                .then(
                    function (itemList) {
                        $scope.itemList = itemList;
                        $scope.itemListIsLoading = false;
                    }
                );
        };
        init();

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
                            $state.go('my.groups.groupId', {groupId: item.id});
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

        $scope.doToggleGroupTopicList = function (group) {
            var groupIndex = _.indexOf($scope.itemList, group);
            if (!group.topics.rows) { // Not expanded
                GroupMemberTopic
                    .query({groupId: group.id}).$promise
                    .then(function (topics) {
                        group.topics.rows = topics;
                        group.topics.count = topics.length;
                        $scope.itemList = $scope.itemList.slice(0, groupIndex + 1).concat(topics, $scope.itemList.slice(groupIndex + 1));
                    });
            } else {
                // Remove all non-Group elements between current Group and the first Group after it
                var indexStart = groupIndex + 1;
                var lastIndex;
                for (var i = indexStart; i < $scope.itemList.length; i++) {
                    if ($scope.isGroup($scope.itemList[i])) {
                        lastIndex = i;
                        break;
                    }
                }

                if (!lastIndex) {
                    lastIndex = $scope.itemList.length;
                }

                $scope.itemList = $scope.itemList.slice(0, indexStart).concat($scope.itemList.slice(lastIndex));
                delete group.topics.rows;
            }
        };

    }]);
