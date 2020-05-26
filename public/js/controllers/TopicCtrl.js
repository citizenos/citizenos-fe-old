'use strict';

/* global _*/

angular
    .module('citizenos')
    .controller('TopicCtrl', ['$rootScope', '$scope', '$state', '$translate', '$stateParams', '$q', '$log', '$sce', '$location', 'ngDialog', 'sAuth', 'sActivity', 'sUpload', 'Topic', 'TopicMemberGroup', 'TopicMemberUser', 'TopicInviteUser', 'TopicVote', 'Mention', 'TopicAttachment', 'rTopic', function ($rootScope, $scope, $state, $translate, $stateParams, $q, $log, $sce, $location, ngDialog, sAuth, sActivity, sUpload, Topic, TopicMemberGroup, TopicMemberUser, TopicInviteUser, TopicVote, Mention, TopicAttachment, rTopic) {
        $log.debug('TopicCtrl', $scope);
        var lastViewTime = null;

        $scope.topic = rTopic;
        $scope.app.topic = rTopic;

        $scope.app.metainfo.title = $scope.topic.title;
        $scope.app.metainfo.description = angular.element('<div/>').html($scope.topic.description.replace(/<br>/gm, '\n')).text().replace($scope.topic.title, '').trim(), // Strip HTML and title

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
                return sActivity.getTopicActivities($scope.topic.id, $scope.activitiesOffset, $scope.activitiesLimit)
                    .then(function (activities) {
                        activities.forEach(function (activityGroups, groupKey) {
                            Object.keys(activityGroups.values).forEach(function (key) {
                                var activity = activityGroups.values[key];

                                if (activity.data.type === 'View' && activity.data.object && activity.data.object['@type'] === 'Activity') {
                                    if (!lastViewTime || activity.updatedAt > lastViewTime) {
                                        lastViewTime = activity.updatedAt;
                                    }
                                    activities.splice(groupKey, 1);
                                } else if (!lastViewTime || activity.updatedAt > lastViewTime) {
                                    activity.isNew = '-new';
                                }
                            });
                        });

                        $scope.activities = $scope.activities.concat(activities);
                    });
            } else {
                return new Promise();
            }
        };

        $scope.doToggleActivities = function () {
            if (!$scope.app.activityFeed) {
                $scope.showLoadMoreActivities = true;
                $scope.loadActivities(0)
                    .then(function () {
                        $scope.app.activityFeed = true;
                        checkIfInView('activities_list');
                    });
            } else {
                $scope.app.activityFeed = !$scope.app.activityFeed;
            }
        };

        if ($scope.app.activityFeed) {
            $scope.showLoadMoreActivities = true;
            $scope.loadActivities(0);
        }

        $scope.showVoteCreate = function () {
            $scope.showVoteCreateForm = !$scope.showVoteCreateForm;
        };

        $scope.doToggleVoteResults = function () {
            $scope.voteResults.isVisible = !$scope.voteResults.isVisible;
            if ($scope.voteResults.isVisible) {
                checkIfInView('vote_results');
            }
        }
        $scope.sendToVote = function () {
            ngDialog
                .openConfirm({
                    template: '/views/modals/topic_send_to_vote_confirm.html'
                })
                .then(function () {
                    if (!$scope.topic.voteId && !$scope.topic.vote) {
                        $scope.app.topics_settings = false;
                        $state.go('topics.view.votes.create', {topicId: $scope.topic.id, commentId: null});
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
                                        commentId: null,
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
                                var stateParams = angular.extend({}, $stateParams, {editMode: null, commentId: null});
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
                                    $state.go('topics.view', {topicId: $scope.topic.id}, {reload: true, commentId: null});
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
                        editMode: $scope.app.editMode,
                        commentId: null
                    }
                );
            } else {
                $state.go(
                    'topics.view',
                    {
                        topicId: $scope.topic.id,
                        editMode: null,
                        commentId: null
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
            var doShowList = $scope.groupList.isVisible;
            if ($scope.groupList.isVisible) {
                $scope.groupList.isVisible = !$scope.groupList.isVisible;
            }
            toggleTabParam('group_list')
                .then(function () {
                    if (!doShowList) {
                        $scope.doShowMemberGroupList();
                        checkIfInView('group_list');
                    } else {

                    }
                });
        };

        $scope.doShowMemberGroupList = function () {
            loadTopicMemberGroupList()
                .then(function () {
                    if ($scope.topic.members.groups.count) {
                        $scope.groupList.isVisible = true;
                    }
                });
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
            return $q
                .all([loadTopicMemberUserList(), loadTopicInviteUserList()])
                .then(function () {
                    $scope.userList.isVisible = true;
                });
        };

        var toggleTabParam = function (tabName) {
            return new Promise (function (resolve) {
                var tabIndex;
                if ($stateParams.openTabs) {
                    tabIndex = $stateParams.openTabs.indexOf(tabName);
                }

                if (tabIndex  > -1) {
                    if (!Array.isArray($stateParams.openTabs)){
                        $stateParams.openTabs = null;
                    } else if($stateParams.openTabs) {
                        $stateParams.openTabs.splice(tabIndex, 1);
                    }
                } else {
                    if (!$stateParams.openTabs) {
                        $stateParams.openTabs = [];
                    }
                    if (!Array.isArray($stateParams.openTabs)){
                        $stateParams.openTabs = [$stateParams.openTabs];
                    }
                    $stateParams.openTabs.push(tabName);
                }

                $state.transitionTo($state.current.name, $stateParams, {
                    notify: true,
                    reload: false
                }).then(function () {
                    return resolve();
                });
            });

        }
        $scope.doToggleMemberUserList = function () {
            var doShowList = $scope.userList.isVisible;
            if ($scope.userList.isVisible) {
                $scope.userList.isVisible = !$scope.userList.isVisible;
            }
            toggleTabParam('user_list')
                .then(function () {
                    if (!doShowList) {
                        $scope.doShowMemberUserList()
                            .then(function() {
                                checkIfInView('user_list');
                            });
                    }
                });
        };

        $scope.viewMemberUsers = function () {
            if (!$scope.userList.isVisible) {
                $scope.doShowMemberUserList()
                    .then(function() {
                        checkIfInView('user_list');
                    });
            } else {
                checkIfInView('user_list');
            }
        };

        $scope.viewMemberGroups = function () {
            if (!$scope.groupList.isVisible) {
                $scope.doShowMemberGroupList();
                checkIfInView('group_list')
            } else {
                checkIfInView('group_list');
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
            return sActivity.showActivityUpdateVersions(activity);
        };

        $scope.keyCounter = function (objIn) {
            return Object.keys(objIn).length;
        };

        $scope.getGroupItems = function (values) {
            var returnArray = [];
            Object.keys(values).forEach(function (key) {
                returnArray.push(values[key]);
            });

            return returnArray;
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

        if ($stateParams.openTabs) {
            $scope.userList.isVisible = false;
            $scope.groupList.isVisible = false;
            if (!Array.isArray($stateParams.openTabs)) {
                $stateParams.openTabs = [$stateParams.openTabs];
            }
            $stateParams.openTabs.forEach(function (tab) {
                switch(tab) {
                    case 'user_list':
                        $scope.doShowMemberUserList();
                        break;
                    case 'group_list':
                        $scope.doShowMemberGroupList();
                        break;
                    case 'activity_feed':
                        $scope.app.activityFeed = true;
                        $scope.loadActivities(0);
                    case 'vote_results':
                        $scope.voteResults.isVisible = true;
                        break;
                }
            });
        }

        $scope.downloadAttachment = function (attachment) {
            return sUpload.download($scope.topic.id, attachment.id, $scope.app.user.id);
        };

        $scope.translateGroup = function (key, group) {
            var values = group[0].values;
            values.groupCount = group.length;

            return $translate.instant(key.split(':')[0], values);
        };

        var listener = $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
            if (fromState.name === 'topics.view.files') {
                $scope.loadTopicAttachments();
            }
        });

        // Unregister
        $scope.$on('$destroy', function () {
            listener();
        });

        var checkIfInView = function (elemId, from) {
            var elem = document.getElementById(elemId);
            var bounding = elem.getBoundingClientRect();

            if ((bounding.top + 100) > (window.scrollY + window.innerHeight)) {
                setTimeout(function () {$scope.app.scrollToAnchor(elemId)}, 200);
            }
        };
    }]);
