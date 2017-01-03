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

        $scope.group = {
            id: null,
            name: null,
            visibility: null,
            members: {
                users:[],
                emails:[]
            }
        };

        $scope.topics = [];
        $scope.memberTopics =[];
        $scope.GroupMemberTopic = GroupMemberTopic;
        $scope.GroupMemberUser = GroupMemberUser;

        $scope.searchString = null;
        $scope.searchResults = null;
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

            $scope.topics = [];
            $scope.memberTopics =[];
            $scope.GroupMemberTopic = GroupMemberTopic;
            $scope.GroupMemberUser = GroupMemberUser;
            $scope.searchString = null;

            $scope.searchResults = {};
            $scope.errors = {
                group: []
            };
        }

        init();

        $scope.search = function (str, type) {
            $scope.searchString = str;
            console.log(str, type);
            if (str && str.length >= 2) {
                sSearch
                    .search(str)
                    .then(function (response) {
                        $scope.searchResults.users = [];
                        $scope.searchResults.topics = [];
                        if(type == 'user'){
                            response.data.data.users.rows.forEach( function (user) {
                                $scope.searchResults.users.push(user);
                            });
                            console.log($scope.searchResults.users);
                        }
                        if(type == 'topic'){
                            response.data.data.topics.rows.forEach( function (topic) {
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

        $scope.doSetGroupTopicLevel = function (topicId, level) {
            var topic = _.find($scope.topics, function (o) {
                return o.id === topicId;
            });
            var topicIndexMembers = _.indexOf($scope.memberTopics,topic);

            if(topicIndexMembers > -1) {
                $scope.memberTopics[topicIndexMembers].permission.level = level;
            }
            var topicIndex = _.indexOf($scope.topics,topic);
            $scope.topics[topicIndex].permission.level = level;

        }

        $scope.doToggleTopicInGroup = function (topicId) {
            if (topicId) {
                var topic = _.find($scope.topics, function (o) {
                    return o.id === topicId;
                });

                var topicIndex = _.indexOf($scope.memberTopics,topic);

                if (topicIndex >-1) {
                    $scope.memberTopics.splice(topicIndex ,1);
                } else {
                    $scope.memberTopics.push(topic);
                }
            }
        }

        var direction = 1;

        $scope.doOrderTopics = function (type) {
            if(type = 'title'){
                $scope.topics.sort(function (a,b){
                    if(a.title > b.title){
                        return 1 *direction;
                    }
                    else if(a.title < b.title){
                        return -1*direction;
                    }
                    return 0;
                });
            }
            if(type = 'users'){
                $scope.topics.sort(function (a,b){
                    if(a.members.users.count > b.members.users.count){
                        return 1 *direction;
                    }
                    else if(a.members.users.count < b.members.users.count){
                        return -1*direction;
                    }
                    return 0;
                });

            }
            direction = direction * -1;
        }

        $scope.doAddUserAsMember = function (user) {
            if(_.indexOf($scope.group.members.users,user) > -1) {
            } else {
                if(!user.level){
                    user.level = GroupMemberUser.LEVELS.read;
                }
                $scope.group.members.users.push(user);
            }
        }

        $scope.selectMember = function (member) {
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
                }
            } else {
                // Assume e-mail was entered.
                if (validator.isEmail($scope.searchString)) {
                    // Ignore duplicates
                    if (!_.find($scope.searchResults.results, {userId: $scope.searchString})) {
                        $scope.group.members.users.push({
                            userId: $scope.searchString,
                            name: $scope.searchString,
                            level: GroupMemberUser.LEVELS.read
                        });
                        $scope.group.members.users.count = $scope.group.members.users.length;
                    }
                } else {
                    $log.debug('Ignoring member, as it does not look like e-mail', $scope.searchString);
                }
            }
            $scope.searchString = null;
        };
        $scope.doRemoveMemberUser = function (user_id) {
            for(var i = 0; i < $scope.group.members.users.length; i++){
                if($scope.group.members.users[i].id === user_id) {
                   $scope.group.members.users.splice(i, 1);
                   i = $scope.group.members.users.length;
                }
            }
        }

        $scope.doChangeMemberPermissions = function (member_id, level) {
            for(var i = 0; i < $scope.group.members.users.length; i++){
                if($scope.group.members.users[i].id === member_id){
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
                        var groupMemberTopic = new GroupMemberTopic(topic);
                        savePromises.push(
                            groupMemberTopic.$save()
                        )
                    });
                })
                .then(function () {
                    Promise.all(savePromises)
                            .then(function (response) {
                                    init();
                                }, function (err){
                                    $log.error(err);
                                }
                            );
                });

        }

    }]);
