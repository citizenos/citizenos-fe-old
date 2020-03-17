'use strict';

angular
    .module('citizenos')
    .controller('TopicCtrl', ['$rootScope', '$scope', '$state', '$stateParams', '$q', '$log', '$sce', '$location', 'ngDialog', 'sAuth', 'sActivity', 'sUpload', 'Topic', 'TopicMemberGroup', 'TopicMemberUser', 'TopicInviteUser', 'TopicVote', 'Mention', 'TopicAttachment', 'rTopic', function ($rootScope, $scope, $state, $stateParams, $q, $log, $sce, $location, ngDialog, sAuth, sActivity, sUpload, Topic, TopicMemberGroup, TopicMemberUser, TopicInviteUser, TopicVote, Mention, TopicAttachment, rTopic) {
        $log.debug('TopicCtrl', $scope);
        var lastViewTime = null;

        $scope.topic = rTopic;
        $scope.app.topic = rTopic;
        $scope.isTopicReported = $scope.topic.report && $scope.topic.report.moderatedReasonType;
        $scope.hideTopicContent = true;

        $scope.doShowReportOverlay = function () {
            ngDialog.openConfirm({
                    template: '/views/modals/topic_reports_reportId.html',
                    data: $stateParams,
                    scope: $scope, // Pass on $scope so that I can access AppCtrl,
                    closeByEscape: false
                })
                .then(
                    function () {
                        // User wants to view the Topic
                        $scope.hideTopicContent = false;
                    },
                    function () {
                        // User clicked away to safety
                        $state.go('home');
                    }
                );
        };

        // Topic has been moderated, we need to show User warning AND hide Topic content
        // As the controller is used both in /my/topics/:topicId and /topics/:topicId the dialog is directly opened
        if ($scope.isTopicReported) {
            // NOTE: Well.. all views that are under the topics.view would trigger doble overlays which we don't want
            // Not nice, but I guess the problem starts with the 2 views using same controller. Ideally they should have a parent controller and extend that with their specific functionality
            if ($state.is('topics.view') || $state.is('my.topics.topicId')) {
                $scope.doShowReportOverlay();
            }
        } else {
            $scope.hideTopicContent = false;
        }

        if ($scope.topic) {
            $scope.topic.padUrl += '&theme=default'; // Change of PAD URL here has to be before $sce.trustAsResourceUrl($scope.topic.padUrl);
            if (!$scope.topic.canEditDescription() && ($stateParams.editMode && $stateParams.editMode === 'true')) {
                $scope.app.editMode = false;
                delete $stateParams.editMode;
                $state.transitionTo($state.current.name, $stateParams, {
                    notify: false,
                    reload: false
                });
            }
        }

        $scope.ATTACHMENT_SOURCES = TopicAttachment.SOURCES;

        $scope.generalInfo = {
            isVisible: true
        };

        $scope.voteResults = {
            isVisible: false
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

        $scope.activities = [];

        $scope.hashtagForm = {
            hashtag: null,
            errors: null,
            bytesLeft: 59
        };

        $scope.topic.padUrl = $sce.trustAsResourceUrl($scope.topic.padUrl);
        $scope.app.editMode = ($stateParams.editMode && $stateParams.editMode === 'true') || false;
        $scope.showInfoEdit = $scope.app.editMode;
        $scope.showVoteArea = false;
        $scope.multipleWinners = false;
        $scope.showInfoWinners = false;

        $scope.STATUSES = Topic.STATUSES;
        $scope.VISIBILITY = Topic.VISIBILITY;

        if ($scope.topic.vote && $scope.topic.vote.options) {
            var winnerCount = 0;
            $scope.topic.vote.options.rows.forEach(function (option) {
                if (option.winner) {
                    winnerCount++;
                    if (winnerCount > 1) {
                        $scope.showInfoWinners = true;
                        $scope.multipleWinners = true;
                    }
                }
            });
        }

        $scope.activitiesOffset = 0;
        $scope.activitiesLimit = 25;

        $scope.showActivityDescription = function (activity) {
            if (activity.data && activity.data.object && (Array.isArray(activity.data.object) && activity.data.object[0]['@type'] === 'Comment' || activity.data.object['@type'] === 'Comment' || activity.data.object.text)) {
                return true;
            }
            return false;
        };

        var loadTopicMemberUserList = function () {
            return TopicMemberUser
                .query({topicId: $scope.topic.id}).$promise
                .then(function (users) {
                    $scope.topic.members.users.rows = users;
                    $scope.topic.members.users.count = users.length;

                    return users;
                });
        };

        var loadTopicInviteUserList = function () {
            return TopicInviteUser
                .query({topicId: $scope.topic.id}).$promise
                .then(function (invites) {
                    $scope.topic.invites = {
                        users: {
                            rows: [],
                            count: 0
                        }
                    };

                    // Need to show only 1 line per User with maximum level
                    // NOTE: Objects don't actually guarantee order if keys parsed to number, it was better if TopicMemberUser.LEVELS was a Map
                    var levelOrder = Object.keys(TopicMemberUser.LEVELS);
                    var inviteListOrderedByLevel = _.orderBy(invites, function (invite) {
                        return levelOrder.indexOf(invite.level);
                    }, ['desc']);
                    $scope.topic.invites.users._rows = invites; // Store the original result from server to implement DELETE ALL, need to know the ID-s of the invites to delete

                    $scope.topic.invites.users.rows = _.sortedUniqBy(inviteListOrderedByLevel, 'user.id');
                    $scope.topic.invites.users.count = invites.length;

                    return invites;
                });
        };

        var loadTopicMemberGroupList = function () {
            return TopicMemberGroup
                .query({topicId: $scope.topic.id}).$promise
                .then(function (groups) {
                    $scope.topic.members.groups.rows = groups;
                    $scope.topic.members.groups.count = groups.length;

                    return groups;
                });
        };

        $scope.loadActivities = function (offset, limit) {
            $scope.activitiesOffset = offset || $scope.activitiesOffset;
            $scope.activitiesLimit = limit || $scope.activitiesLimit;
            if ($scope.activities.length && !offset && !limit) {
                $scope.activitiesOffset += $scope.activitiesLimit;
            }
            if ($scope.topic) {
                sActivity.getTopicActivities($scope.topic.id, $scope.activitiesOffset, $scope.activitiesLimit)
                    .then(function (activities) {
                        activities.forEach(function (activity, key) {
                            activity.values.topicTitle = $scope.topic.title;
                            if (activity.data.type === 'View' && activity.data.object && activity.data.object['@type'] === 'Activity') {
                                if (!lastViewTime || activity.updatedAt > lastViewTime) {
                                    lastViewTime = activity.updatedAt;
                                }
                                activities.splice(key, 1);
                            } else if (!lastViewTime || activity.updatedAt > lastViewTime) {
                                activity.isNew = '-new';
                            }
                        });
                        $scope.showLoadMoreActivities = !(activities.length < $scope.activitiesLimit);
                        $scope.activities = $scope.activities.concat(activities);
                    });
            }
        };

        $scope.doToggleActivities = function () {
            $scope.app.activityFeed = !$scope.app.activityFeed;
            if ($scope.app.activityFeed) {
                $scope.showLoadMoreActivities = true;
                $scope.loadActivities(0);
            }
        };

        if ($scope.app.activityFeed) {
            $scope.showLoadMoreActivities = true;
            $scope.loadActivities(0);
        }

        $scope.showVoteCreate = function () {
            $scope.showVoteCreateForm = !$scope.showVoteCreateForm;
        };

        $scope.sendToVote = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_send_to_vote_confirm.html'
                })
                .then(function () {
                    if (!$scope.topic.voteId && !$scope.topic.vote) {
                        $scope.app.topics_settings = false;
                        $state.go('topics.view.votes.create', {topicId: $scope.topic.id});
                    } else if (($scope.topic.voteId || $scope.topic.vote && $scope.topic.vote.id) && $scope.topic.status !== $scope.STATUSES.voting) {
                        $log.debug('sendToVote');
                        return new Topic({
                            id: $scope.topic.id,
                            status: $scope.STATUSES.voting
                        })
                        .$patch()
                        .then(
                            function (topicPatched) {
                                $scope.topic.status = topicPatched.status;
                                $scope.app.topics_settings = false;
                                $state.go('topics.view.votes.view', {
                                        topicId: $scope.topic.id,
                                        voteId: $scope.topic.vote.id,
                                        editMode: null
                                    },
                                    {reload: true}
                                );
                            }
                        );
                    }
                    return false;
                }, angular.noop);
        };

        $scope.sendToFollowUp = function (stateSuccess) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_send_to_followUp_confirm.html'
                })
                .then(function () {
                    return new Topic({
                        id: $scope.topic.id,
                        status: $scope.STATUSES.followUp
                    })
                        .$patch()
                        .then(
                            function (topicPatched) {
                                $scope.topic.status = topicPatched.status;
                                $scope.app.topics_settings = false;
                                var stateNext = stateSuccess || 'topics.view.followUp';
                                var stateParams = angular.extend({}, $stateParams, {editMode: null});
                                $state.go(
                                    stateNext,
                                    stateParams,
                                    {
                                        reload: true
                                    }
                                );
                            }
                        );
                }, angular.noop);
        };

        $scope.closeTopic = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_close_confirm.html'
                })
                .then(function () {
                    return new Topic({
                        id: $scope.topic.id,
                        status: $scope.STATUSES.closed
                    })
                        .$patch()
                        .then(
                            function (topicPatched) {
                                $scope.topic.status = topicPatched.status;
                                $scope.app.topics_settings = false;
                                if ($state.is('topics.view.votes.view')) {
                                    $state.go('topics.view', {topicId: $scope.topic.id}, {reload: true});
                                }
                            }
                        );
                }, angular.noop);
        };

        $scope.loadTopicSocialMentions = function () {
            if ($scope.topic.hashtag) {
                $scope.topicSocialMentions = Mention.query({topicId: $scope.topic.id});
            }
        };

        $scope.loadTopicSocialMentions();

        $scope.app.doToggleEditMode = function () {
            $scope.app.editMode = !$scope.app.editMode;
            $scope.app.topics_settings = false;
            if ($scope.app.editMode === true) {
                $state.go(
                    'topics.view',
                    {
                        topicId: $scope.topic.id,
                        editMode: $scope.app.editMode
                    }
                );
            } else {
                $state.go(
                    'topics.view',
                    {
                        topicId: $scope.topic.id,
                        editMode: null
                    },
                    {
                        reload: true
                    }
                );
            }
        };

        $scope.hideInfoEdit = function () {
            $scope.showInfoEdit = false
        };

        $scope.loadTopicAttachments = function () {
            $scope.topicAttachments = TopicAttachment.query({topicId: $scope.topic.id});
        };

        $scope.loadTopicAttachments();

        $scope.doDeleteTopic = function () {
            $log.debug('doDeleteTopic');

            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_delete_confirm.html'
                })
                .then(function () {
                    $scope.topic
                        .$delete()
                        .then(function () {
                            $state.go('my.topics', null, {reload: true});
                        });
                }, angular.noop);
        };

        $scope.doLeaveTopic = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_leave_confirm.html',
                    data: {
                        topic: $scope.topic
                    }
                })
                .then(function () {
                    var topicMemberUser = new TopicMemberUser({id: sAuth.user.id});
                    topicMemberUser
                        .$delete({topicId: $scope.topic.id})
                        .then(function () {
                            $state.go('my.topics', null, {reload: true});
                        });
                });
        };

        $scope.doSetTopicStatus = function (status) {
            if (status !== $scope.topic.status) {
                $scope.topic.status = status;
                $scope.topic.$update(function (data) {
                    $scope.topic = Topic.get({topicId: $stateParams.topicId});
                });
            }
        };

        $scope.doSaveVoteEndsAt = function () {
            return $scope.topic.vote
                .$update({topicId: $scope.topic.id})
                .then(function (vote) {
                    // TODO: Reload from server until GET /:voteId and PUT /:voteId return the same output
                    return vote.$get({topicId: $scope.topic.id});
                });
        };

        $scope.TopicMemberGroup = TopicMemberGroup;

        $scope.doToggleMemberGroupList = function () {
            if ($scope.groupList.isVisible) {
                $scope.groupList.isVisible = false;
            } else {
                $scope.doShowMemberGroupList();
            }
        };

        $scope.doShowMemberGroupList = function () {
            if ($scope.groupList.isVisible) {
                $scope.app.scrollToAnchor('group_list');
            } else {
                loadTopicMemberGroupList()
                    .then(function () {
                        $scope.groupList.isVisible = true;
                        $scope.app.scrollToAnchor('group_list');
                    });
            }
        };

        $scope.doUpdateMemberGroup = function (topicMemberGroup, level) {
            $log.debug('doUpdateMemberGroup', topicMemberGroup, level);

            if (topicMemberGroup.level !== level) {
                var oldLevel = topicMemberGroup.level;
                topicMemberGroup.level = level;
                topicMemberGroup
                    .$update({topicId: $scope.topic.id})
                    .then(
                        function () {
                            if ($scope.userList.isVisible) { // Reload User list when Group permissions change as User permissions may also change
                                loadTopicMemberUserList();
                            }
                        },
                        function () {
                            topicMemberGroup.level = oldLevel;
                        }
                    );
            }
        };

        $scope.doDeleteMemberGroup = function (topicMemberGroup) {
            $log.debug('doDeleteMemberGroup', topicMemberGroup);

            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_group_delete_confirm.html',
                    data: {
                        group: topicMemberGroup
                    }
                })
                .then(function () {
                    topicMemberGroup
                        .$delete({topicId: $scope.topic.id})
                        .then(function () {
                            $scope.topic.members.groups.rows.splice($scope.topic.members.groups.rows.indexOf(topicMemberGroup), 1);
                            $scope.topic.members.groups.count = $scope.topic.members.groups.rows.length;
                            loadTopicMemberUserList();
                        });
                }, angular.noop);
        };

        $scope.TopicMemberUser = TopicMemberUser;

        $scope.doShowMemberUserList = function () {
            if (!$scope.userList.isVisible) {
                $q
                    .all([loadTopicMemberUserList(), loadTopicInviteUserList()])
                    .then(function () {
                        $scope.userList.isVisible = true;
                        $scope.app.scrollToAnchor('user_list');
                    });
            } else {
                $scope.app.scrollToAnchor('user_list');
            }
        };

        $scope.doToggleMemberUserList = function () {
            if ($scope.userList.isVisible) {
                $scope.userList.isVisible = false;
            } else {
                $scope.doShowMemberUserList();
            }
        };

        $scope.doUpdateMemberUser = function (topicMemberUser, level) {
            if (topicMemberUser.level !== level) {
                var oldLevel = topicMemberUser.level;
                topicMemberUser.level = level;
                topicMemberUser
                    .$update({topicId: $scope.topic.id})
                    .then(
                        function () {
                            topicMemberUser.levelUser = level;
                        },
                        function (res) {
                            topicMemberUser.level = oldLevel;
                        });
            }
        };

        $scope.doDeleteMemberUser = function (topicMemberUser) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_delete_confirm.html',
                    data: {
                        user: topicMemberUser
                    }
                })
                .then(function () {
                    topicMemberUser
                        .$delete({topicId: $scope.topic.id})
                        .then(function () {
                            return loadTopicMemberUserList(); // Good old topic.members.users.splice wont work due to group permission inheritance
                        });
                }, angular.noop);
        };

        $scope.doDeleteInviteUser = function (topicInviteUser) {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_invite_user_delete_confirm.html',
                    data: {
                        user: topicInviteUser.user
                    }
                })
                .then(function (isAll) {
                    var promisesToResolve = [];

                    // Delete all
                    if (isAll) {
                        $scope.topic.invites.users._rows.forEach(function (invite) {
                            if (invite.user.id === topicInviteUser.user.id) {
                                promisesToResolve.push(invite.$delete({topicId: $scope.topic.id}));
                            }
                        });
                    } else { // Delete single
                        promisesToResolve.push(topicInviteUser.$delete({topicId: $scope.topic.id}));
                    }

                    $q
                        .all(promisesToResolve)
                        .then(function () {
                            return loadTopicInviteUserList();
                        });
                }, angular.noop);
        };

        $scope.showActivityUpdateVersions = function (activity) {
            if (activity.data.type === 'Update') {
                if (activity.data.result && (Array.isArray(activity.data.object) && activity.data.object[0]['@type'] === 'Topic' && activity.data.result[0].path.indexOf('description') > -1 || !Array.isArray(activity.data.object) && activity.data.object['@type'] === 'Topic' && activity.data.result[0].path.indexOf('description') > -1)) {
                    return false;
                }
                if (activity.data.object['@type'] === 'CommentVote' && activity.data.type === 'Update' && activity.data.resultObject && activity.data.resultObject.value === 0) {
                    return false;
                }
                if (activity.data.result && !Array.isArray(activity.data.object) && activity.data.object['@type'] === 'TopicMemberUser' && activity.data.result[0].path.indexOf('level') > -1 && activity.data.result[0].value === 'none') {
                    return false;
                }
                return true;
            }
            return false;
        };

        $scope.activityRedirect = function (activity) {
            return sActivity.handleActivityRedirect(activity);
        };

        $scope.togglePin = function () {
            if (!$scope.app.user.loggedIn) {
                $scope.app.doShowLogin();
                return;
            }

            $scope.topic.togglePin()
                .then(function () {
                    if ($state.current.name.indexOf('my') > -1) {
                        $state.reload();
                    }
                });
        };

        $scope.downloadAttachment = function (attachment) {
            return sUpload.download($scope.topic.id, attachment.id, $scope.app.user.id);
        };

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
            if (fromState.name === 'topics.view.files') {
                $scope.loadTopicAttachments();
            }
        });
    }
    ]);
