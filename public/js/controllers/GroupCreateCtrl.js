'use strict';

angular
    .module('citizenos')
    .controller('GroupCreateCtrl', ['$scope', '$state', '$stateParams', '$log', 'sSearch', 'Group', 'GroupMemberUser', 'GroupMemberTopic', function ($scope, $state, $stateParams, $log, sSearch, Group, GroupMemberUser, GroupMemberTopic) {

        $scope.levels = {
            none: 0,
            read: 1,
            edit: 2,
            admin: 3
        }

        $scope.topicList = {
            searchFilter: '',
            searchOrderBy: {
                property: 'title'
            }
        };

        $scope.group = {
            id: null,
            name: null,
            visibility: null,
            members: {
                users:[],
                emails:[]
            }
        };

        $scope.memberTopics =[];
        $scope.GroupMemberTopic = GroupMemberTopic;
        $scope.GroupMemberUser = GroupMemberUser;

        $scope.searchResults = {};
        $scope.searchStringUser = null;
        $scope.searchStringTopic = null;
        $scope.errors = {
            group: []
        };

        $log.debug('GroupCreateCtrl');

        $scope.tabSelected = 'settings';

        var init = function () {
            $scope.group = {
                id: null,
                name: null,
                visibility: null,
                members: {
                    users:[],
                    emails:[]
                }
            };

            $scope.memberTopics =[];
            $scope.GroupMemberTopic = GroupMemberTopic;
            $scope.GroupMemberUser = GroupMemberUser;
            $scope.searchStringUser = null;
            $scope.searchStringTopic = null;

            $scope.searchResults = {};
            $scope.errors = {
                group: []
            };
        }

        init();

        $scope.search = function (str, type) {
            if (str && str.length >= 2) {
                include = null;
                if(type == 'topic'){
                    include = 'my.topic';
                }
                else if(type == 'user'){
                    include = 'public.user';
                }
                sSearch
                    .searchV2(str, include)
                    .then(function (response) {
                        $scope.searchResults.users = [];
                        $scope.searchResults.topics = [];
                        if(type == 'user'){;
                            response.data.data.results.public.users.forEach( function (user) {
                                $scope.searchResults.users.push(user);
                            });
                        }
                        if(type == 'topic'){
                            response.data.data.results.my.topics.forEach( function (topic) {
                                $scope.searchResults.topics.push(topic);
                            });
                        }

                    },
                    function (response) {
                        $log.error('Search failed...', response);
                    });
            } else {
                $scope.searchResults.users = [];
                $scope.searchResults.topics = [];
            }
        };

        $scope.addTopicToGroup = function (topic) {
            if(!topic || !topic.id || !topic.title){
                return false;
            }
            var member = _.find($scope.memberTopics, function (o) {
                return o.id === topic.id;
            });
            if(!member) {
                topic.permission.level = 'read';
                $scope.memberTopics.push(topic);
            }
            $scope.searchStringTopic = null;
            $scope.searchResults.topics = [];
        }

        $scope.removeTopicFromGroup = function (topicId) {
            for(var i = 0; i < $scope.memberTopics.length; i++){
                if($scope.memberTopics[i].id === topicId) {
                   $scope.memberTopics.splice(i, 1);
                   i = $scope.memberTopics.length;
                }
            }
        }

        $scope.doSetGroupTopicLevel = function (topicId, level) {
            _.find($scope.memberTopics, function (o) {
                if(o.id === topicId){
                    o.permission.level = level;
                    return true;
                }
            });
            console.log($scope.memberTopics);
        }

        $scope.dOrderTopics = function (property) {
            if($scope.topicList.searchOrderBy.property == property) {
                if(property.indexOf('-') === 0) {
                    property = property.replace('-','');
                }
                else {
                    property = '-'+property;
                }
            }
            $scope.topicList.searchOrderBy.property = property;
        }

        $scope.addUserAsMember = function (member) {
            if (member) {
                if (_.find($scope.group.members.users, {userId: member.id})) {
                    // Ignore duplicates
                    return;
                } else {
                    var memberClone = angular.copy(member);
                    memberClone.userId = member.id;
                    memberClone.level = GroupMemberUser.LEVELS.read;

                    $scope.group.members.users.push(memberClone);
                    $scope.group.members.users.count = $scope.group.members.users.length;
                    $scope.searchResults.users = [];
                }
            } else {
                // Assume e-mail was entered.
                if (validator.isEmail($scope.searchStringUser)) {
                    // Ignore duplicates
                    if (!_.find($scope.searchResults.results, {userId: $scope.searchStringUser})) {
                        $scope.group.members.users.push({
                            userId: $scope.searchStringUser,
                            name: $scope.searchStringUser,
                            level: GroupMemberUser.LEVELS.read
                        });
                        $scope.group.members.users.count = $scope.group.members.users.length;
                        $scope.searchResults.users = [];
                    }
                } else {
                    $log.debug('Ignoring member, as it does not look like e-mail', $scope.searchStringUser);
                }
            }
            $scope.searchStringUser = null;
            $scope.searchResults.topics = [];
        };
        $scope.doRemoveMemberUser = function (userId) {
            for(var i = 0; i < $scope.group.members.users.length; i++){
                if($scope.group.members.users[i].id === userId) {
                   $scope.group.members.users.splice(i, 1);
                   i = $scope.group.members.users.length;
                }
            }
        }

        $scope.doChangeMemberPermissions = function (memberId, level) {
            for(var i = 0; i < $scope.group.members.users.length; i++){
                if($scope.group.members.users[i].id === memberId){
                    $scope.group.members.users[i].level = level;
                    i = $scope.group.members.users.length;
                }
            }
        }

        $scope.doSaveGroup = function () {
            if (!$scope.group.name){
                $scope.errors.group.name = true;
                $scope.tabSelected = 'settings';
                return;
            }
            $scope.errors.group = [];
            var group = new Group($scope.group);
            var savePromises = [];
            group.$save()
                .then(function (data) {
                    angular.extend($scope.group, data);

                    var usersCount = 0;
                    var topicsCount = 0;
                    angular.extend($scope.group.members.users, $scope.group.members.emails);

                    $scope.group.members.users.forEach(function (member, key) {
                        usersCount++;
                        member.groupId = $scope.group.id;
                        var groupMember = new GroupMemberUser(member);
                        savePromises.push(
                            groupMember.$save()
                        )
                    });

                    $scope.memberTopics.forEach(function (topic, key) {
                        topic.groupId = $scope.group.id;
                        topic.topicId = topic.id;
                        topicsCount++;
                        console.log('TOPIC', topic);
                        var groupMemberTopic = new GroupMemberTopic(topic);
                        savePromises.push(
                            groupMemberTopic.$save()
                        )
                    });
                })
                .then(function () {
                    Promise.all(savePromises)
                            .then(function (response) {
                              //      $state.go('my.groups', $scope.group.id);
                                }, function (err){
                                    $log.error(err);
                                }
                            );
                });

        }

    }]);
